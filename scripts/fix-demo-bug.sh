#!/usr/bin/env bash
set -euo pipefail

APP_FILE="${1:-/Users/randyhaddad/Desktop/GBrain Hackathon/callstack/demo-app/index.html}"

if ! [[ -f "$APP_FILE" ]]; then
  echo "App file not found: $APP_FILE" >&2
  exit 1
fi

# Demo fix: allow Enterprise accounts to use the promised CSV export feature.
perl -0pi -e 's/const canExport = plan === "pro";/const canExport = ["pro", "enterprise"].includes(plan);/' "$APP_FILE"

git -C "$(dirname "$APP_FILE")" add index.html >/dev/null 2>&1 || true
git -C "$(dirname "$APP_FILE")" diff -- index.html || true
echo "Fixed: Enterprise tenants can now see CSV export."
