// ─────────────────────────────────────────────────────────────────────────────
// firebase.ts
//
// STATIC  → firebase/app  (tiny, always needed to initialise the SDK)
// LAZY    → firebase/auth, firebase/firestore, firebase/analytics
//           (loaded only when first requested, so the main bundle stays light)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp } from "firebase/app";

// ── Config ────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

// ── App (static — must be ready before anything else) ────────────────────────
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export default app;

// ─────────────────────────────────────────────────────────────────────────────
// LAZY: firebase/auth
// Single cached promise so the module is only fetched once.
// ─────────────────────────────────────────────────────────────────────────────
import type { Auth } from "firebase/auth";

let _authPromise: Promise<Auth> | null = null;

/** Returns the shared Auth instance (loads firebase/auth on first call). */
export function getAuthInstance(): Promise<Auth> {
  if (!_authPromise) {
    _authPromise = import("firebase/auth").then(({ getAuth }) => getAuth(app));
  }
  return _authPromise;
}

// Re-export the type so other files can still do `import type { User } from '@/lib/firebase'`
export type { User, ConfirmationResult } from "firebase/auth";

// ── Auth helper functions (lazy wrappers) ─────────────────────────────────────

export async function signInWithEmailAndPassword(
  email: string,
  password: string
) {
  const [{ signInWithEmailAndPassword: fn }, auth] = await Promise.all([
    import("firebase/auth"),
    getAuthInstance(),
  ]);
  return fn(auth, email, password);
}

export async function createUserWithEmailAndPassword(
  email: string,
  password: string
) {
  const [{ createUserWithEmailAndPassword: fn }, auth] = await Promise.all([
    import("firebase/auth"),
    getAuthInstance(),
  ]);
  return fn(auth, email, password);
}

export async function signInWithPhoneNumber(
  phoneNumber: string,
  appVerifier: import("firebase/auth").ApplicationVerifier
) {
  const [{ signInWithPhoneNumber: fn }, auth] = await Promise.all([
    import("firebase/auth"),
    getAuthInstance(),
  ]);
  return fn(auth, phoneNumber, appVerifier);
}

export async function createRecaptchaVerifier(
  containerId: string,
  params?: Record<string, unknown>
): Promise<import("firebase/auth").RecaptchaVerifier> {
  const [{ RecaptchaVerifier }, auth] = await Promise.all([
    import("firebase/auth"),
    getAuthInstance(),
  ]);
  return new RecaptchaVerifier(auth, containerId, params);
}

export async function signInWithGooglePopup() {
  const [{ GoogleAuthProvider, signInWithPopup, signInWithRedirect }, auth] =
    await Promise.all([import("firebase/auth"), getAuthInstance()]);
  try {
    return await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (
      code === "auth/cancelled-popup-request" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/popup-blocked" ||
      code === "auth/web-storage-unsupported"
    ) {
      return signInWithRedirect(auth, new GoogleAuthProvider());
    }
    throw err;
  }
}

export async function signInWithGoogleRedirect() {
  const [{ GoogleAuthProvider, signInWithRedirect }, auth] = await Promise.all([
    import("firebase/auth"),
    getAuthInstance(),
  ]);
  return signInWithRedirect(auth, new GoogleAuthProvider());
}

export async function signInWithGithubPopup() {
  const [{ GithubAuthProvider, signInWithPopup, signInWithRedirect }, auth] =
    await Promise.all([import("firebase/auth"), getAuthInstance()]);
  const provider = new GithubAuthProvider();
  provider.addScope("read:user");
  provider.addScope("user:email");
  try {
    return await signInWithPopup(auth, provider);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (
      code === "auth/cancelled-popup-request" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/popup-blocked" ||
      code === "auth/web-storage-unsupported"
    ) {
      return signInWithRedirect(auth, provider);
    }
    throw err;
  }
}

export async function signInWithGithubRedirect() {
  const [{ GithubAuthProvider, signInWithRedirect }, auth] = await Promise.all([
    import("firebase/auth"),
    getAuthInstance(),
  ]);
  const provider = new GithubAuthProvider();
  provider.addScope("read:user");
  provider.addScope("user:email");
  return signInWithRedirect(auth, provider);
}

export async function signOut() {
  const [{ signOut: fn }, auth] = await Promise.all([
    import("firebase/auth"),
    getAuthInstance(),
  ]);
  return fn(auth);
}

/**
 * Subscribe to auth token changes — returns a synchronous unsubscribe fn so
 * it can be used directly as a useEffect cleanup return value.
 *
 * Firebase/auth is loaded lazily on first call; any change events that fire
 * before the module loads are queued internally by Firebase itself.
 */
export function subscribeToAuthChanges(
  callback: (user: import("firebase/auth").User | null) => void
): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;

  getAuthInstance().then(async (auth) => {
    if (cancelled) return;
    const { onIdTokenChanged: fn } = await import("firebase/auth");
    if (cancelled) return;
    unsub = fn(auth, callback);
  });

  // Return a synchronous cleanup that cancels any pending setup
  return () => {
    cancelled = true;
    unsub?.();
  };
}

/** @deprecated Use subscribeToAuthChanges for useEffect cleanup compatibility */
export async function onIdTokenChanged(
  callback: (user: import("firebase/auth").User | null) => void
) {
  const [{ onIdTokenChanged: fn }, auth] = await Promise.all([
    import("firebase/auth"),
    getAuthInstance(),
  ]);
  return fn(auth, callback);
}

/**
 * Get the currently signed-in user (or null). Lazily loads firebase/auth.
 * Use subscribeToAuthChanges for reactive updates.
 */
export async function getCurrentUser(): Promise<import("firebase/auth").User | null> {
  const auth = await getAuthInstance();
  return auth.currentUser;
}

export async function getIdTokenResult(
  user: import("firebase/auth").User,
  forceRefresh?: boolean
) {
  const { getIdTokenResult: fn } = await import("firebase/auth");
  return fn(user, forceRefresh);
}

// ─────────────────────────────────────────────────────────────────────────────
// LAZY: firebase/firestore
// ─────────────────────────────────────────────────────────────────────────────
import type { Firestore } from "firebase/firestore";

let _dbPromise: Promise<Firestore> | null = null;

/** Returns the shared Firestore instance (loads firebase/firestore on first call). */
export function getDbInstance(): Promise<Firestore> {
  if (!_dbPromise) {
    _dbPromise = import("firebase/firestore").then(({ getFirestore }) =>
      getFirestore(app)
    );
  }
  return _dbPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAZY: firebase/analytics (browser-only, already async-safe)
// ─────────────────────────────────────────────────────────────────────────────
export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (await isSupported()) return getAnalytics(app);
  return null;
}
