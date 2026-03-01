import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

const app = initializeApp(firebaseConfig as Record<string, string>);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Google provider helper
export const googleProvider = new GoogleAuthProvider();
export async function signInWithGooglePopup() {
  return signInWithPopup(auth, googleProvider);
}

export function signOut() {
  return firebaseSignOut(auth);
}

export async function signInWithGoogleRedirect() {
  // use redirect as a fallback for environments where popups are blocked
  // this will navigate away from the app and return via Firebase redirect flow
  const { signInWithRedirect } = await import('firebase/auth');
  return signInWithRedirect(auth, googleProvider);
}

// GitHub provider helper
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

export async function signInWithGithubPopup() {
  return signInWithPopup(auth, githubProvider);
}

export async function signInWithGithubRedirect() {
  const { signInWithRedirect } = await import('firebase/auth');
  return signInWithRedirect(auth, githubProvider);
}

let analytics: ReturnType<typeof getAnalytics> | null = null;

// Initialize Analytics only in environments that support it (browser)
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch(() => {
      // ignore analytics errors in non-browser environments
    });
}

export { analytics };

export default app;
