#!/usr/bin/env bash
# One-liner helper: loads .env.local (if present), starts example backend and frontend,
# then opens the Checkout status URL in the default browser.
# Usage: bash scripts/start-e2e-one-liner.sh

set -euo pipefail

echo "Checklist:\n- Ensure .env.local exists with required keys (VITE_API_URL, STRIPE secrets if needed)\n- This script will start the example backend (server/stripe-example.js) and the frontend (npm run dev)\n- The Checkout status URL will be opened after servers start\n"

# Load .env.local into environment if present (simple parser; ignores comments and blank lines)
if [ -f .env.local ]; then
  echo "Loading .env.local"
  set -a
  # shellcheck disable=SC1090
  . ./.env.local
  set +a
else
  echo ".env.local not found — continuing but ensure required env vars are set." >&2
fi

# One-liner to run: (printed for convenience and executed)
ONE_LINER='(cd server && node stripe-example.js > server/server.log 2>&1 &) && npm run dev > dev.log 2>&1 & sleep 3 && URL="http://localhost:8081/checkout/status" && (command -v xdg-open >/dev/null 2>&1 && xdg-open "$URL") || (command -v open >/dev/null 2>&1 && open "$URL") || (command -v cmd.exe >/dev/null 2>&1 && cmd.exe /C start "" "$URL") || echo "Open $URL in your browser"'

echo "One-liner command (also executing it):\n$ONE_LINER\n"

# Execute the one-liner
eval "$ONE_LINER"

echo "Started backend and frontend; logs: server/server.log, dev.log. If browser didn't open, visit http://localhost:8081/checkout/status"
