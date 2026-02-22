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


