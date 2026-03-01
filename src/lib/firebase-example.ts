// ─────────────────────────────────────────────────────────────────────────────
// firebase-example.ts — helper utilities using the lazy firebase wrappers
//
// auth and db are NOT imported statically here — they are resolved lazily via
// getDbInstance() / the auth helper functions to keep the bundle light.
// ─────────────────────────────────────────────────────────────────────────────

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getDbInstance,
} from "./firebase";

import type { WhereFilterOp } from "firebase/firestore";

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(email, password);
}

export async function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(email, password);
}

export async function logOut() {
  return signOut();
}

// ── Firestore helpers (lazy — firebase/firestore loads on first call) ─────────

export async function addDocument(
  collectionName: string,
  data: Record<string, unknown>
) {
  const db = await getDbInstance();
  const { collection, addDoc } = await import("firebase/firestore");
  return addDoc(collection(db, collectionName), data);
}

export async function queryDocuments(
  collectionName: string,
  field: string,
  op: WhereFilterOp,
  value: unknown
) {
  const db = await getDbInstance();
  const { collection, query, where, getDocs } = await import(
    "firebase/firestore"
  );
  const q = query(collection(db, collectionName), where(field, op, value));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* Usage examples:
import { signIn, signUp, addDocument, queryDocuments } from './lib/firebase-example';

await signUp('me@example.com', 'password123');
await signIn('me@example.com', 'password123');
await addDocument('posts', { title: 'Hello', createdAt: Date.now() });
const items = await queryDocuments('posts', 'title', '==', 'Hello');
*/
