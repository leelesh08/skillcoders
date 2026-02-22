import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

// Auth helpers
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

// Firestore helpers (simple examples)
export async function addDocument(collectionName: string, data: Record<string, any>) {
  const col = collection(db, collectionName);
  return addDoc(col, data);
}

export async function queryDocuments(collectionName: string, field: string, op: string, value: any) {
  const col = collection(db, collectionName);
  const q = query(col, where(field, op as any, value));
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
