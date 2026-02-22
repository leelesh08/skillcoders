# Deployment — Firebase Hosting

Quick steps to deploy this Vite app to Firebase Hosting.

1) Install Firebase CLI (optional locally):

```bash
npm install -g firebase-tools
```

2) Build the app locally:

```bash
npm install
npm run build
```

3) To deploy interactively (local):

```bash
firebase login
firebase deploy --only hosting --project skill-coders-2025
```

4) CI / GitHub Actions: the repo includes `.github/workflows/firebase-hosting-deploy.yml` which builds and deploys on pushes to `main`.

   - Create a CI token with `firebase login:ci` and add it to the repository secrets as `FIREBASE_TOKEN`.
   - Alternatively, use a service account and set `FIREBASE_SERVICE_ACCOUNT` secret; update workflow accordingly.

5) Notes:

- The build output is `dist` (Vite default) and `firebase.json` points hosting to `dist`.
- Ensure your `.env.local` Vite variables are set for runtime config (not required for hosting itself).
