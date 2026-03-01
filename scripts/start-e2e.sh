#!/usr/bin/env bash
# Usage:
# STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx FRONTEND_URL=http://localhost:8081 ./scripts/start-e2e.sh [ORDER_ID|SESSION_ID]

set -e

FRONTEND_URL=${FRONTEND_URL:-http://localhost:8081}
ORDER_OR_SESSION=$1

echo "Starting backend (server/stripe-example.js) with FRONTEND_URL=${FRONTEND_URL}"
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY} STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET} FRONTEND_URL=${FRONTEND_URL} node server/stripe-example.js &
BACKEND_PID=$!

echo "Starting frontend (vite)"
npm run dev &
FRONTEND_PID=$!

echo "Servers started: backend PID=${BACKEND_PID}, frontend PID=${FRONTEND_PID}"

sleep 2

if [ -n "${ORDER_OR_SESSION}" ]; then
  # If argument looks like starts with cs_ treat as session_id
  if [[ "$ORDER_OR_SESSION" == cs_* ]]; then
    URL="${FRONTEND_URL}/checkout/status?session_id=${ORDER_OR_SESSION}"
  else
    URL="${FRONTEND_URL}/checkout/status?orderId=${ORDER_OR_SESSION}"
  fi
else
  URL="${FRONTEND_URL}"
fi

echo "Opening ${URL} in default browser..."
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" || true
elif command -v open >/dev/null 2>&1; then
  open "$URL" || true
else
  echo "Please open: $URL"
fi

wait
