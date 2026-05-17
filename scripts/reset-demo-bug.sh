#!/usr/bin/env bash
set -euo pipefail

target="${1:-/Users/randyhaddad/Desktop/GBrain Hackathon/callstack/demo-app/index.html}"

fixed='const canExport = ["pro", "enterprise"].includes(plan);'
broken='const canExport = plan === "pro";'

if ! grep -Fq "$fixed" "$target"; then
  echo "Demo bug already present or expected fixed line not found: $target"
  exit 0
fi

perl -0pi -e 's/\Qconst canExport = ["pro", "enterprise"].includes(plan);\E/const canExport = plan === "pro";/' "$target"
echo "Reset demo bug in $target"
