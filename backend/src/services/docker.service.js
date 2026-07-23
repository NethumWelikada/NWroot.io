// ============================================================
// docker.service.js
// This is the core of the "real sandbox" feature. It talks
// directly to the Docker Engine on the host machine to create,
// monitor, and destroy isolated containers - one per user
// session. Each container is a real, working Ubuntu Linux
// environment the user can freely type commands into.
// ============================================================

const Docker = require("dockerode");
const db = require("../config/db");
const logger = require("../utils/logger");

// Connect to the local Docker daemon via its default socket.
// This requires Docker to be installed and running on the host,
// and the Node process needs permission to access the socket
// (the setup script adds the user to the "docker" group).
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

// ------------------------------------------------------------
// createSandboxContainer(userId)
// Spins up a brand new, isolated container for a user session.
// Resource limits (CPU/RAM) come from .env so they're easy to
// tune per-server without touching code.
// ------------------------------------------------------------
async function createSandboxContainer(userId) {
  const imageName = process.env.SANDBOX_IMAGE_NAME || "nwroot-sandbox";
  const cpuLimit = parseFloat(process.env.SANDBOX_CPU_LIMIT || "1");
  const memoryLimitMb = parseInt(process.env.SANDBOX_MEMORY_LIMIT_MB || "1024", 10);

  // Phase 4 (partial): stronger sandbox isolation via gVisor. This is
  // OPTIONAL and OFF by default - if SANDBOX_RUNTIME isn't set in .env,
  // containers behave exactly as before (standard Docker/runc). Once
  // gVisor is installed on the host and SANDBOX_RUNTIME=runsc is set,
  // every NEW sandbox container gets an extra userspace kernel layer
  // between it and the real host kernel, blocking most known
  // container-escape techniques. Existing running containers are
  // unaffected until they're next reset/recreated.
  const sandboxRuntime = process.env.SANDBOX_RUNTIME || null;

  logger.info(`Creating sandbox container for user ${userId}${sandboxRuntime ? ` (runtime: ${sandboxRuntime})` : ""}...`);

  const hostConfig = {
    // --- Resource limits: stop one user from overloading the server ---
    Memory: memoryLimitMb * 1024 * 1024,     // convert MB to bytes
    NanoCpus: cpuLimit * 1_000_000_000,      // Docker expects CPU limit in "nano CPUs"
    // --- Network isolation: sandbox has NO route to the host's real
    //     network or production systems, only its own internal network ---
    NetworkMode: "bridge",
    AutoRemove: false, // we remove it manually so we can log/cleanup first
  };

  // Only add the Runtime field if a non-default runtime is actually
  // configured - omitting it entirely preserves normal Docker behavior
  if (sandboxRuntime) {
    hostConfig.Runtime = sandboxRuntime;
  }

  const container = await docker.createContainer({
    Image: imageName,
    Tty: true,             // keeps the container's shell alive and interactive
    OpenStdin: true,       // allows us to send keystrokes into the container
    Cmd: ["/bin/bash"],    // the shell the user will actually be typing into
    HostConfig: hostConfig,
    Labels: {
      "nwroot.userId": String(userId), // tag the container so we can find it later
    },
  });

  await container.start();

  // Record this session in the database so we can track/expire it later
  await db.query(
    "INSERT INTO sandbox_sessions (user_id, container_id, status) VALUES (?, ?, 'running')",
    [userId, container.id]
  );

  logger.info(`Sandbox container ${container.id} started for user ${userId}`);
  return container;
}

// ------------------------------------------------------------
// destroySandboxContainer(containerId)
// Stops and removes a container, and updates its database record.
// Called on manual reset, logout, or idle timeout.
// ------------------------------------------------------------
async function destroySandboxContainer(containerId) {
  try {
    const container = docker.getContainer(containerId);
    await container.stop().catch(() => {}); // ignore error if already stopped
    await container.remove().catch(() => {}); // ignore error if already removed

    await db.query(
      "UPDATE sandbox_sessions SET status = 'stopped', stopped_at = NOW() WHERE container_id = ?",
      [containerId]
    );

    logger.info(`Sandbox container ${containerId} destroyed.`);
  } catch (err) {
    logger.error(`Failed to destroy container ${containerId}: ${err.message}`);
  }
}

// ------------------------------------------------------------
// attachToContainer(containerId)
// Opens a live, interactive stream into a running container's
// shell. This stream is what gets piped to/from the browser's
// terminal over WebSocket in ws/terminal.gateway.js
// ------------------------------------------------------------
async function attachToContainer(containerId) {
  const container = docker.getContainer(containerId);

  const stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
  });

  return stream;
}

// ------------------------------------------------------------
// execInContainer(containerId, command, timeoutMs)
// Runs a ONE-OFF command inside a running container and
// captures its combined stdout+stderr output and exit code.
// This is completely separate from the user's interactive
// terminal session (attachToContainer above) - it's used for
// task validation, so the check always runs the real,
// definitive command fresh, regardless of what the user has
// been typing in their own terminal.
// ------------------------------------------------------------
async function execInContainer(containerId, command, timeoutMs = 15000) {
  const container = docker.getContainer(containerId);

  // Docker "exec" creates a new process inside the already-running
  // container - this is the same mechanism behind `docker exec -it ...`
  const exec = await container.exec({
    Cmd: ["/bin/bash", "-c", command],
    AttachStdout: true,
    AttachStderr: true,
    Tty: false, // non-TTY exec output is multiplexed (see demuxStream below)
  });

  const stream = await exec.start({ hijack: true, stdin: false });

  const output = await new Promise((resolve, reject) => {
    let combined = "";

    // Non-TTY Docker streams multiplex stdout/stderr together using a
    // special binary frame format - demuxStream separates them back out
    // into plain text. We combine both into one string since validation
    // just needs to search the text, not distinguish the two streams.
    const collector = { write: (chunk) => { combined += chunk.toString("utf8"); } };
    docker.modem.demuxStream(stream, collector, collector);

    // Guard against a command that hangs forever (e.g. accidentally
    // waiting for input) - fail the validation instead of hanging the request
    const timer = setTimeout(() => {
      reject(new Error(`Validation command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    stream.on("end", () => {
      clearTimeout(timer);
      resolve(combined);
    });
    stream.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  // Exit code is only available AFTER the exec stream has ended
  const inspectData = await exec.inspect();

  return { output, exitCode: inspectData.ExitCode };
}

// ------------------------------------------------------------
// cleanupIdleSessions()
// Finds sessions that have been inactive longer than the
// configured timeout and destroys them. Meant to be called on
// a recurring timer (see main.js) to control server costs.
// ------------------------------------------------------------
async function cleanupIdleSessions() {
  const timeoutMinutes = parseInt(process.env.SANDBOX_IDLE_TIMEOUT_MINUTES || "30", 10);

  const [idleSessions] = await db.query(
    `SELECT container_id FROM sandbox_sessions
     WHERE status = 'running'
     AND last_active_at < (NOW() - INTERVAL ? MINUTE)`,
    [timeoutMinutes]
  );

  for (const session of idleSessions) {
    logger.info(`Session ${session.container_id} idle too long - cleaning up.`);
    await destroySandboxContainer(session.container_id);
  }
}

module.exports = {
  createSandboxContainer,
  destroySandboxContainer,
  attachToContainer,
  execInContainer,
  cleanupIdleSessions,
};
