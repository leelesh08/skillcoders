# Welcome to your skill coders project

## Project info

**URL**: https://skillcoders.com/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use SkillCoders**

Simply visit the [skillcoders Project](https://skillcoders.com/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via skillcoders will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in skill coders.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [skillcoders](https://skillcoders/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my skillcoders project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.skillcoders.com/features/custom-domain#custom-domain)

## Frontend ↔ Backend wiring

This repo includes a minimal Express backend in the `server/` folder and a Vite + React frontend in `src/`.

- Frontend: `src/pages/Login.tsx` signs in with Firebase Auth and sends the Firebase ID token to the backend `POST /verifyToken` endpoint.
- Backend: `server/index.js` exposes `POST /verifyToken` to verify ID tokens using the Firebase Admin SDK and `GET /instances` to list Cloud SQL instances using Google APIs.

Environment variables and configuration

- Frontend: create `.env.local` in the project root and set `VITE_API_URL` to your backend base URL (example: `https://<your-backend-url>`):

```env
VITE_API_URL=https://your-backend.example.com
```

- Backend: see `server/.env.example`. Provide credentials either by setting `GOOGLE_APPLICATION_CREDENTIALS` (path to service account JSON) or by adding `FIREBASE_SERVICE_ACCOUNT_BASE64` (base64-encoded JSON) to the Cloud Run service or CI secrets.

CI / Deployment

- Frontend: this project uses Firebase Hosting; see `firebase.json` and `.github/workflows/firebase-hosting-deploy.yml` for automated deploys on `main` (requires `FIREBASE_TOKEN` secret).
- Backend: workflow `.github/workflows/backend-cloudrun-deploy.yml` builds and deploys the `server/` to Cloud Run. Add the following repository secrets:
	- `GCP_SA_KEY` — service account JSON (contents)
	- `GCP_PROJECT` — GCP project id
	- `GCP_REGION` — Cloud Run region (e.g., `us-central1`)

Security notes

- Do not commit service account JSON files. Use repository secrets and environment variables.
- Ensure the service account has least privilege (run admin + cloud build as needed).

Using the backend from pages

Use the helper `src/lib/api.ts` to call backend endpoints from any page. It automatically:

- prefixes requests with `VITE_API_URL` (set in `.env.local`), and
- attaches the current Firebase ID token as `Authorization: Bearer <token>` when a user is signed in.

Example:

```ts
import { api } from './src/lib/api';

// GET /instances
const instances = await api.get('/instances?projectId=your-project-id');

// POST /verifyToken
await api.post('/verifyToken', { idToken });
```


