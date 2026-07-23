# ============================================================
# NWroot.io Sandbox Image
# This is the image used to create EVERY user's sandbox
# container. It's a real Ubuntu environment with common tools
# pre-installed but NOT running by default - users start/stop
# and configure services themselves as part of the lessons.
#
# IMPORTANT: `systemctl` inside this container is NOT the real
# systemd binary. Plain Docker containers don't run systemd as
# PID 1, so real systemctl can't function. Instead, a lightweight
# shim script (systemctl-shim.sh) is installed in its place,
# translating start/stop/status/enable/disable/is-active/
# is-enabled into real /etc/init.d service management. This
# keeps the actual Apache/MySQL processes 100% real - only the
# systemd control layer itself is simulated. See systemctl-shim.sh
# for the full explanation and the reasoning behind this choice
# (real systemd-in-Docker requires --privileged mode, which is
# too large a security tradeoff for a public multi-tenant sandbox
# running on plain Docker isolation).
# ============================================================

FROM ubuntu:22.04

# Prevent apt from asking interactive questions during install
ENV DEBIAN_FRONTEND=noninteractive

# ------------------------------------------------------------
# Install the tools needed across the lesson tracks:
# - apache2, mysql-server: for web server + database labs
# - net-tools, iproute2, iputils-ping, curl: for networking labs
# - ufw: for basic firewall labs
# - vim, nano: text editors
# - cron: for scheduling labs
# - openssh-server: for SSH labs
# - git: for version control and GitHub Actions labs
# - python3-yaml: for validating workflow/config YAML syntax in
#   GitHub Actions and Infrastructure as Code labs
# - ansible: for Infrastructure as Code labs (runs playbooks
#   against localhost, no external servers needed)
# - terraform: for Infrastructure as Code labs (uses the local
#   provider only - no real cloud credentials/cost involved)
# ------------------------------------------------------------
RUN apt-get update && apt-get install -y \
    apache2 \
    mysql-server \
    net-tools \
    iproute2 \
    iputils-ping \
    curl \
    wget \
    ufw \
    vim \
    nano \
    cron \
    openssh-server \
    sudo \
    man-db \
    git \
    python3-yaml \
    ansible \
    gnupg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------
# Install Terraform from HashiCorp's official apt repository.
# NOTE: this exact install path could not be executed-tested in
# the environment this Dockerfile was authored in (restricted
# network egress that couldn't reach HashiCorp's servers) - these
# are HashiCorp's own standard, widely-used install commands, but
# verify this step completes successfully on your real server
# before relying on the Infrastructure as Code lessons.
# ------------------------------------------------------------
RUN wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com jammy main" | tee /etc/apt/sources.list.d/hashicorp.list && \
    apt-get update && apt-get install -y terraform && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------
# Install the systemctl shim, taking precedence over the real
# (non-functional, no-systemd) systemctl binary since
# /usr/local/bin comes before /usr/bin in the default PATH
# (this also holds true under sudo - Ubuntu's default
# secure_path includes /usr/local/bin in the same position).
# ------------------------------------------------------------
COPY systemctl-shim.sh /usr/local/bin/systemctl
RUN chmod +x /usr/local/bin/systemctl

# Services are installed but NOT auto-started or pre-enabled -
# the shim's "enabled" state starts empty for every fresh
# container, so lessons teaching start/enable are testing the
# real thing, not a pre-solved answer.

# Create a non-root practice user (some lessons cover sudo/permissions properly)
RUN useradd -m -s /bin/bash student && \
    echo "student:student" | chpasswd && \
    usermod -aG sudo student

# Pre-configure git identity for BOTH root and the student user.
# IMPORTANT: the interactive terminal session actually runs as root
# (there's no USER directive in this Dockerfile, so Docker defaults
# to root) - the "student@nwroot-sandbox" label in the terminal header
# is just a cosmetic UI label, not the real shell user. Without this,
# `git commit` fails with "Please tell me who you are" on a completely
# fresh container, breaking the very first GitHub Actions lesson task
# before the student even reaches the actual CI/CD content.
RUN git config --global user.email "student@nwroot-sandbox" && \
    git config --global user.name "Student" && \
    su - student -c "git config --global user.email 'student@nwroot-sandbox' && git config --global user.name 'Student'"

# Set a friendly working directory
WORKDIR /home/student

# Keep the container alive with an interactive bash shell -
# the backend attaches directly to this shell over Docker's API.
CMD ["/bin/bash"]
