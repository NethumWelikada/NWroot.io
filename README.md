# NWroot.io

### Sudo won't fix ignorance.

**A real, hands-on Linux, Docker, and DevOps sandbox playground - learn by actually doing, not by reading.**

> Developed by **Nethum Welikada** - Master of Engineering in Internetworking Student, Dalhousie University, Halifax, Nova Scotia, Canada

---

## What is NWroot.io?

NWroot.io is an open-source, browser-based learning platform where users get a **real, isolated Linux sandbox** - not a simulation - to practice system administration, web server configuration, databases, networking, and containerization.

Every command actually runs inside a real Docker container. Every mistake is real. Every reset gives you a fresh environment to try again.

Built for:
- Complete beginners learning Linux for the first time
- Students preparing for professional Linux certification-style topics (users/groups, permissions, storage, systemd, networking, firewalls)
- Aspiring System Administrators, DevOps Engineers, and Solution Architects who need real hands-on CLI practice
- Anyone without access to their own servers who wants to safely practice Linux, Docker, and DevOps skills

---

## Core Features

- **Real isolated terminal sessions** - one Docker container per user, connected via a live browser terminal
- **Email + password authentication** with first/last name - email is the login identifier, name is what the UI actually displays
- **Split-screen Lesson Workspace** - task checklist with hints and one-click "Run" (types the command directly into the terminal) or "Copy" on one side, a real live terminal on the other
- **Per-task completion tracking with XP and computed levels** - checking off tasks awards XP; completing every task in a lesson auto-completes it; level is always calculated from total XP, never stored separately, so it can't drift out of sync
- **Profile page** - level, XP progress bar, lessons completed, tasks completed, member since
- **Search + category filters** on the Lessons page - one shared tile board across all tracks, not sparse per-track sections
- **Content tracks**, not just basics:
  - Linux Fundamentals (filesystem, file operations)
  - Users & Permissions
  - Storage & LVM basics
  - Systemd & Services
  - Networking & Firewall basics
  - Apache Web Server Labs (virtual hosts)
  - MySQL Database Labs (users, privileges, databases)
  - Docker Labs (images, containers, lifecycle)
- Each task shows **exam relevance** and practical tips
- **Reset button** - instantly destroy and recreate a clean sandbox
- **Fully responsive UI** - desktop, tablet, and mobile
- **Auto-expiring sandbox sessions** - idle containers are cleaned up automatically
- **systemctl works in every sandbox** via a lightweight, fully-tested shim (real Apache/MySQL processes underneath - only the systemd control layer itself is simulated, since real systemd-in-Docker requires `--privileged` mode, too large a security tradeoff for a public multi-tenant sandbox on plain Docker isolation)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite (minified production builds via Terser) |
| UI Font | Inter (headings, body, buttons, forms) |
| Terminal Font | Geist Mono (the actual terminal only - xterm.js requires monospace) |
| Icons | lucide-react |
| Terminal UI | xterm.js |
| Backend | Node.js + Express + `ws` (WebSockets) |
| Auth | JWT + bcrypt password hashing |
| Database | MySQL 8+ |
| Web server | Apache (reverse proxy, `mod_proxy_wstunnel` for WebSockets) |
| Sandbox isolation | Docker (per-session containers, CPU/RAM limited) |
| Process manager | PM2 |
| OS | Ubuntu Linux (staging **and** production - no Windows/local dependency) |

**Design:** Background `#1A1A1A`, Text `#F7F8F9`, primary accent `#0066FF` (blue), secondary accent `#FF7A1A` (orange, used for XP/level/achievement elements).

---

## Project Structure

```
NWroot.io/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── api/                # Axios client (reads API URL from env)
│   │   ├── context/             # Auth state (login/signup/logout)
│   │   ├── hooks/                # usePageTitle and other shared hooks
│   │   ├── components/          # Navbar, Footer, Terminal, ProtectedRoute
│   │   └── pages/                # Login, Signup, Dashboard, Lessons, LessonDetail, Sandbox, Profile
│   ├── .env.staging              # Staging build config
│   ├── .env.production           # Production build config
│   └── vite.config.js
│
├── backend/                   # Node.js + Express API + WebSocket gateway
│   ├── src/
│   │   ├── config/db.js          # MySQL connection pool
│   │   ├── middleware/auth.js     # JWT verification
│   │   ├── controllers/            # Auth, Lessons, Tasks, Sandbox, Profile logic
│   │   ├── services/                # Docker orchestration, lesson file reader
│   │   ├── ws/terminal.gateway.js   # Live terminal WebSocket <-> Docker
│   │   └── main.js                  # Entry point
│   ├── sql/
│   │   └── schema.sql             # Creates the database, user, grants, and every table in one file
│   ├── lessons/                  # Markdown/YAML lesson content (see "Adding New Lessons" below)
│   ├── docker/sandbox-image/     # Dockerfile + systemctl shim for every user's sandbox container
│   └── .env                       # Backend environment config (real defaults included)
│
├── deploy/                    # Server configuration (no automatic deployment script)
│   └── apache/000-nwroot-staging.conf # Apache virtual host config (port 8080)
│
├── LICENSE                    # MIT, with attribution requirement
├── CONTRIBUTORS.md             # Project credits
└── README.md                   # This file
```

**Why this layout:** `lessons/`, `docker/sandbox-image/`, and `.env` all live inside `backend/` because they're backend-owned - only the backend reads lesson YAML files, builds/manages sandbox containers, and reads its own environment config. `deploy/` holds server configuration (currently just the Apache virtual host); there is no automatic deployment script, setup is manual - see below.

---

## Setup (Ubuntu)

There is no automatic install script - follow the manual steps below. This is
intentional: each step is small enough to verify individually, and it's the
same process whether you're setting up staging or production.

### Prerequisites
- Ubuntu 22.04+ server/VM with `sudo` access
- Internet access on the server

```bash
git clone https://github.com/your-username/NWroot.io.git
cd NWroot.io
```

Then follow the steps in "Manual Setup" below.

---

## Default Credentials (Ships Ready-to-Run)

This repository intentionally ships with **working default credentials** so it runs immediately after cloning.

| Setting | Value |
|---|---|
| Database name | `nwroot_db` |
| Database user | `nwrootu` |
| Database password | `nwrootu12` |

> ⚠️ **Change `DB_PASSWORD` and `JWT_SECRET` in `backend/.env` before any public/production deployment.**

---

## Manual Setup (Step-by-Step)

### 1. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install MySQL
```bash
sudo apt-get install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
```

### 3. Set up the database (creates DB, user, grants, AND every table in one command)
```bash
sudo mysql < backend/sql/schema.sql
```

### 4. Install Apache and required modules
```bash
sudo apt-get install -y apache2
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite
```

### 5. Install Docker
```bash
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER
```

### 6. Build the sandbox image
```bash
cd backend/docker/sandbox-image
docker build -t nwroot-sandbox .
cd ../../..
```

### 7. Install PM2
```bash
sudo npm install -g pm2
```

### 8. Install and start the backend
```bash
cd backend
npm install
pm2 start src/main.js --name nwroot-backend
```

**Critical - do this now, not later:** without this step, the backend will NOT restart automatically after a server reboot, and will simply vanish (you'll see `[PM2][ERROR] Process or Namespace nwroot-backend not found` next time you try to use it). Run:
```bash
pm2 startup
```
This prints a command specific to your system (starts with something like `sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root`) - **copy and run that exact printed command**, then lock in the current process list:
```bash
pm2 save
cd ..
```

### 9. Install, build, and deploy the frontend
```bash
cd frontend
npm install
npm run build:staging
cd ..
```

### 10. Configure Apache
```bash
sudo cp deploy/apache/000-nwroot-staging.conf /etc/apache2/sites-available/000-nwroot-staging.conf
echo "Listen 8080" | sudo tee -a /etc/apache2/ports.conf
sudo a2ensite 000-nwroot-staging.conf
sudo systemctl reload apache2
```

---

## Service Checking / Troubleshooting Commands

Use these any time something isn't working - they cover every layer of the stack, in the order most likely to reveal the problem.

**Backend (PM2):**
```bash
pm2 status                          # is the backend process running at all?
pm2 logs nwroot-backend --lines 50 --nostream   # recent backend errors
pm2 restart nwroot-backend          # restart after a code change
pm2 save                            # lock in the current process list
```

**Backend health check (bypasses the UI entirely):**
```bash
curl -s http://localhost:3000/api/health
```

**Apache:**
```bash
sudo systemctl status apache2 --no-pager
sudo apache2ctl configtest          # catches config syntax errors before reload
sudo systemctl reload apache2
sudo tail -30 /var/log/apache2/nwroot-staging-error.log
```

**MySQL:**
```bash
sudo systemctl status mysql --no-pager
mysqladmin ping                     # quick "is it alive" check
mysql -u nwrootu -pnwrootu12 nwroot_db -e "SHOW TABLES;"
```

**Docker:**
```bash
sudo systemctl status docker --no-pager
docker images | grep nwroot-sandbox   # confirm the sandbox image was built
docker ps -a                           # see all sandbox containers, running or stopped
```

**Ports actually listening (confirms Apache is on 8080 and the backend is on 3000):**
```bash
sudo ss -tulnp | grep -E "8080|3000"
```

**Full request path test (browser -> Apache -> backend):**
```bash
curl -v http://<your-server-ip>:8080/api/health
```

**PM2 auto-start on reboot** (if the backend disappears after a server restart, this was likely never configured):
```bash
pm2 startup      # copy and run the command it prints, then:
pm2 save
```

---

## Changing the Server IP / Port

If your server's LAN IP changes, update it in **three places**, then rebuild the frontend and reload Apache:

1. `backend/.env` → `APP_URL`
2. `frontend/.env.staging` → `VITE_API_URL` and `VITE_WS_URL`
3. `deploy/apache/000-nwroot-staging.conf` → the `<VirtualHost IP:PORT>` line and `ServerName`

```bash
cd frontend && npm run build:staging
sudo cp deploy/apache/000-nwroot-staging.conf /etc/apache2/sites-available/000-nwroot-staging.conf
sudo systemctl reload apache2
```

---

## Environment Variables Reference

```env
APP_NAME="NWroot.io"
APP_ENV=staging
APP_DEBUG=true
APP_DEVELOPER="Nethum Welikada"

# --- STAGING ---
APP_URL=http://192.168.1.131:8080
# --- PRODUCTION ---
#APP_URL=XXXXXXXXXX

TIMEZONE=Asia/Colombo
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nwroot_db
DB_USER=nwrootu
DB_PASSWORD=nwrootu12
DB_CHARSET=utf8mb4

JWT_SECRET=nwroot_dev_secret_change_before_production
JWT_EXPIRES_IN=7d

SANDBOX_IMAGE_NAME=nwroot-sandbox
SANDBOX_IDLE_TIMEOUT_MINUTES=30
SANDBOX_CPU_LIMIT=1
SANDBOX_MEMORY_LIMIT_MB=1024
```

The frontend uses **separate** env files per build mode (`frontend/.env.staging`, `frontend/.env.production`), since Vite bakes these values into the build at compile time.

---

## Database

The database is fully defined by a single file: `backend/sql/schema.sql`. Running it once creates the database, the MySQL user, the required privileges, and every table - no additional setup steps needed.

If the schema needs to change in the future, update `backend/sql/schema.sql` directly.

---

## Adding New Lessons

Lessons live as plain YAML files under `backend/lessons/<track-name>/`. No code changes needed - just drop a new `.yaml` file into an existing or new track folder and restart the backend.

```yaml
title: "Lesson Title"
description: "One or two sentence summary of what this teaches."
difficulty: beginner   # beginner | intermediate | advanced
estimated_minutes: 15
exam_relevance: "Why this matters for certification exams or real-world work."
tasks:
  - id: 1
    instruction: "What the learner should do."
    hint: "The actual command to run."
    validation_command: "the command that would verify it"
    expected_output_contains: "text expected in output"
  - id: 2
    instruction: "..."
    hint: "..."
    validation_command: "..."
    expected_output_contains: "..."
notes: "Optional extra tips or common gotchas."
```

Task `id` values must be sequential integers starting at 1 within each lesson - the XP/completion system relies on this.

---

## Roadmap

- [x] Phase 1 - Auth (with name collection), real sandbox sessions, working `systemctl` via shim, content tracks across Linux fundamentals, users/permissions, storage, systemd, networking, Apache, MySQL, and Docker
- [x] Phase 2 - Per-task completion, XP/levels, Profile page, search + category filters
- [x] Phase 3 - Live automatic task validation - clicking a task checkbox actually runs its validation command inside the user's real sandbox container and only awards completion/XP if the real output matches
- [ ] Phase 4 - Scaled orchestration (Docker Swarm/Kubernetes), stronger sandbox isolation (gVisor/Firecracker)
- [ ] Phase 5 - CI/CD pipeline labs (Jenkins/GitHub Actions)
- [ ] Phase 6 - Infrastructure as Code labs (Ansible/Terraform)
- [ ] Phase 7 - Kubernetes labs (k3s/minikube)
- [ ] Phase 8 - LVM create/extend labs (requires attaching an extra virtual disk per sandbox)

---

## Security Notes for Anyone Deploying This

- Change `DB_PASSWORD` and `JWT_SECRET` in `backend/.env` before production use
- Sandbox containers are resource-limited (CPU/RAM via `backend/.env`) but **plain Docker is not a perfect security boundary** - for a public-facing product at real scale, consider gVisor or Firecracker for stronger isolation
- `systemctl` inside sandboxes is intentionally a lightweight shim, not real systemd - this was a deliberate choice to avoid running sandboxes in `--privileged` mode, which would be a larger security tradeoff on plain Docker isolation. See `backend/docker/sandbox-image/systemctl-shim.sh` for details
- The idle session cleanup job (every 5 minutes) helps control both cost and abuse - don't disable it in production
- This project is not a substitute for a professional security review before handling real public traffic

---

## Contributing

Contributions are welcome, particularly new lesson content - see the "Adding New Lessons" section above for the format. See [CONTRIBUTORS.md](./CONTRIBUTORS.md) for project credits.

---

## License

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) for full terms.

The MIT License requires that the original copyright notice and attribution be retained in all copies and substantial portions of this software, including forks and derivative works.

## Attribution

**NWroot.io** was designed and developed by **Nethum Welikada**, Master of Engineering in Internetworking student at Dalhousie University, Halifax, Nova Scotia, Canada, as a project to make real, hands-on Linux and DevOps fundamentals accessible to beginners everywhere - starting in Sri Lanka, built for the world.

If you fork, deploy, or build upon this project, please retain this attribution in the README, LICENSE, and application footer, in accordance with the MIT License terms.
