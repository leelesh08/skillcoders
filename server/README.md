# Stripe Checkout Example (Express)

This folder contains a minimal Node.js + Express example showing how to create Stripe Checkout sessions and handle webhooks.

Environment variables
- `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_...`).
- `STRIPE_WEBHOOK_SECRET` - webhook signing secret from Stripe dashboard.
- `FRONTEND_URL` - URL to redirect users after success/cancel (e.g., `http://localhost:8081`).
- `CURRENCY` (optional) - currency code, default `inr`.

Quick start

1. Install dependencies:

```bash
npm install express stripe body-parser
```

2. Run the example (set env vars):

```bash
STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx FRONTEND_URL=http://localhost:8081 node server/stripe-example.js
```

Endpoints
- `POST /checkout` - create a checkout session. Accepts either `items` array (with productId, name, price, quantity) or `amount` (for simple single-item flows). Returns `{ sessionId, url }`.
- `POST /webhook` - webhook receiver. Use raw body and the Stripe signature to verify events, then handle `checkout.session.completed` to fulfill orders.

- `GET /session/:id` - retrieve a checkout session by ID. The example server expands `line_items.data.price.product` so you can inspect product metadata and session.metadata (userId, orderId) for fulfillment or UI confirmation.

Orders persistence (mock)

The example server stores created orders in `server/orders.json` when a checkout session is created. Each order looks like:

```json
{
	"orderId": "...",
	"userId": "...",
	"type": "gadget|course|battle",
	"itemId": "...",
	"sessionId": "cs_...",
	"fulfilled": false,
	"createdAt": "..."
}
```

Test endpoints:

- `GET /orders/:orderId` — return stored order record.
- `PUT /orders/:orderId/fulfill` — mark stored order as fulfilled (useful for testing/manual fulfillment).

Webhook behavior:

When `checkout.session.completed` is received and `session.metadata.orderId` is present, the webhook handler will mark the corresponding order `fulfilled: true` and add `paidAt` timestamp in `orders.json`.

Stripe CLI webhook forwarding (local testing)

Install the Stripe CLI and forward webhook events to your local server for development:

```bash
# login once
stripe login

# forward events to port 4242 (example)
stripe listen --forward-to localhost:4242/webhook
```

This will print a webhook signing secret (use `stripe listen --print-secret` or copy from output) — set that value as `STRIPE_WEBHOOK_SECRET` when running the example server so it can verify signatures.



Security notes
- Create Stripe sessions on the server using your **secret** key. Never store or use secret keys in frontend code.
- Use the webhook signing secret to verify incoming webhook events.
# Backend (Express + Firebase Admin)

This minimal backend provides:

- `POST /verifyToken` — verify a Firebase ID token and return decoded token info.
- `GET /instances?projectId=...` — list Cloud SQL instances for a project (requires Google credentials).

Setup

1. Install dependencies and run:

```bash
cd server
npm install
npm run start
```

2. Provide credentials (one of these):

- Set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json` (recommended for local/CI), or
- Set `FIREBASE_SERVICE_ACCOUNT_BASE64` to a base64-encoded JSON service account key.

3. Set `GCP_PROJECT_ID` in env or pass `?projectId=...` to `/instances`.

Security

Do not commit service account JSON to the repository. Use CI secrets for deployment.

CI / Cloud Run (GitHub Actions)

This repo includes a workflow `.github/workflows/backend-cloudrun-deploy.yml` that builds and deploys the `server/` to Cloud Run.

Required repository secrets:

- `GCP_SA_KEY` — JSON service account key (the whole JSON contents). The workflow uses this to authenticate the Cloud SDK.
- `GCP_PROJECT` — GCP project id where Cloud Run will be created.
- `GCP_REGION` — Cloud Run region (e.g., `us-central1`).

Additional environment notes:

- Ensure the service account has permission to deploy Cloud Run and to use Cloud Build (roles/run.admin, roles/cloudbuild.builds.editor, roles/storage.admin as needed).
- The server expects credentials via `GOOGLE_APPLICATION_CREDENTIALS` (for local) or you can set `FIREBASE_SERVICE_ACCOUNT_BASE64` in Cloud Run to pass the key as a base64 env var.
- Set `GCP_PROJECT_ID` in Cloud Run service env vars if your endpoints rely on it, and update the frontend `VITE_API_URL` to point at the deployed Cloud Run URL.

Build and run locally with Docker (optional):

```bash
# from repo root
cd server
docker build -t skillcoders-backend:local .
docker run -e PORT=4000 -p 4000:4000 skillcoders-backend:local
```

CLI: set custom claims (with audit)

You can set custom claims from the command line using the provided helper.

Local usage (requires service account credentials):

```bash
cd server
node cli/setClaims.js --uid TARGET_UID --claims '{"admin":true}' --actor ADMIN_UID --reason "promote to admin"
```

Notes:
- The CLI initializes the Admin SDK using `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_BASE64`.
- The CLI writes an audit record to the `admin_audit` collection in Firestore with `action`, `actorUid`, `targetUid`, `previousClaims`, `newClaims`, `reason`, `source: 'cli'`, and `createdAt`.
- The admin API endpoint `/admin/users/:uid/claims` also writes the same audit record with `source: 'admin-api'`.

Extra protection for admin actions

If you want an additional secret header check on the admin API endpoint, set the environment variable `ADMIN_ACTION_KEY` on the server. When present, requests to `POST /admin/users/:uid/claims` must include header `x-admin-action-key: <ADMIN_ACTION_KEY>` or they'll be rejected.


