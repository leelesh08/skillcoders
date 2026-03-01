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

## Payment integration (backend contract)

This project expects a backend endpoint to create payment/checkout sessions. The frontend calls `POST /checkout` with a JSON body depending on action:

- Enroll in course: `{ type: 'course', id: <courseId> }`
- Join battle: `{ type: 'battle', id: <battleId>, amount: <number> }`
- Purchase gadget: `{ type: 'gadget', id: <gadgetId> }`

Recommended backend responses (choose one):

1) Redirect URL (any provider):

   ```json
   { "url": "https://checkout.provider/checkout/session/abc" }
   ```

   The frontend will perform `window.location.href = url`.

2) Stripe Checkout session (preferred for Stripe):

   ```json
   { "sessionId": "cs_test_..." }
   ```

   If the backend returns `sessionId`, the frontend will load `@stripe/stripe-js` and call `redirectToCheckout({ sessionId })` using the publishable key in `VITE_STRIPE_PK`.

Env vars used by this flow (add to `.env.local`):

- `VITE_API_URL` — base URL for backend (used by `src/lib/api.ts`).
- `VITE_STRIPE_PK` — Stripe publishable key (client-side). The backend must use the secret key to create sessions.

Security note: create checkout sessions on the server using provider-secret keys. Do NOT put secret keys in frontend code or public repos.
