#!/bin/bash
# ============================================================
# systemctl-shim
# A lightweight stand-in for `systemctl` inside a plain Docker
# container, where no real systemd runs as PID 1. Translates
# the common start/stop/restart/status/enable/disable/is-active/
# is-enabled subcommands into REAL service management via the
# classic /etc/init.d scripts - so lessons that teach real-world
# systemctl usage still control a REAL running Apache/MySQL
# process. Only the systemd layer itself is simulated; the
# services it manages are 100% real.
# ============================================================

ACTION="$1"
SERVICE="$2"
STATE_DIR="/var/lib/systemctl-shim/enabled"
mkdir -p "$STATE_DIR"

INIT_SCRIPT="/etc/init.d/$SERVICE"

case "$ACTION" in
  start|stop|restart)
    if [ -x "$INIT_SCRIPT" ]; then
      "$INIT_SCRIPT" "$ACTION"
    else
      echo "Failed to $ACTION $SERVICE.service: Unit $SERVICE.service not found."
      exit 1
    fi
    ;;

  status)
    if [ -x "$INIT_SCRIPT" ]; then
      "$INIT_SCRIPT" status
    else
      echo "Unit $SERVICE.service could not be found."
      exit 4
    fi
    ;;

  is-active)
    if [ -x "$INIT_SCRIPT" ] && "$INIT_SCRIPT" status > /dev/null 2>&1; then
      echo "active"
      exit 0
    else
      echo "inactive"
      exit 3
    fi
    ;;

  enable)
    touch "$STATE_DIR/$SERVICE"
    echo "Created symlink /etc/systemd/system/multi-user.target.wants/$SERVICE.service -> /lib/systemd/system/$SERVICE.service."
    ;;

  disable)
    rm -f "$STATE_DIR/$SERVICE"
    echo "Removed /etc/systemd/system/multi-user.target.wants/$SERVICE.service."
    ;;

  is-enabled)
    if [ -f "$STATE_DIR/$SERVICE" ]; then
      echo "enabled"
      exit 0
    else
      echo "disabled"
      exit 1
    fi
    ;;

  *)
    echo "systemctl-shim: unsupported action '$ACTION' (supported: start, stop, restart, status, is-active, enable, disable, is-enabled)"
    exit 1
    ;;
esac
