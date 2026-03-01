@echo off
:: One-liner helper (Windows): starts example backend and frontend, then opens the Checkout status URL.
:: Usage: scripts\start-e2e-one-liner.cmd
:: Note: Ensure .env.local exists in the repo root with required keys before running.

@echo Checklist:
@echo - Ensure .env.local exists with required keys (VITE_API_URL, STRIPE secrets if needed)
@echo - This script will start the example backend (server\stripe-example.js) and the frontend (npm run dev)
@echo - The Checkout status URL will be opened after servers start
@echo.

:: Try to load simple KEY=VALUE lines from .env.local (best-effort)
if exist .env.local (
  for /f "usebackq tokens=1* delims==" %%A in (".env.local") do (
    set "%%A=%%B"
  )
) else (
  echo .env.local not found; continuing but ensure required env vars are set
)

:: Start backend in a new cmd window
start "backend" cmd /k "cd /d %~dp0..\server && node stripe-example.js"
:: Start frontend in a new cmd window
start "frontend" cmd /k "cd /d %~dp0.. && npm run dev"
:: wait a few seconds then open status URL
timeout /t 3 /nobreak >nul
start "" "http://localhost:8081/checkout/status"

echo Started backend and frontend. Check server\server.log and dev.log for output if present.