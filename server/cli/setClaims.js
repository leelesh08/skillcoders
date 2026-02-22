#!/usr/bin/env node
/**
 * CLI helper to set custom claims and write an audit record to Firestore.
 * Usage:
 *   node cli/setClaims.js --uid targetUid --claims '{"admin":true}' --actor changerUid --reason "promotion"
 * Environment:
 *   GOOGLE_APPLICATION_CREDENTIALS must point to a service account JSON or
 *   FIREBASE_SERVICE_ACCOUNT_BASE64 may contain the base64-encoded key.
 */
require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      out[key] = val;
      if (val !== true) i++;
    }
  }
  return out;
}

(async function main() {
  const argv = parseArgs();
  const uid = argv.uid;
  const actor = argv.actor || process.env.ADMIN_CLI_ACTOR || null;
  const reason = argv.reason || null;
  let claims = argv.claims || null;

  if (!uid) {
    console.error('Error: --uid is required');
    process.exit(2);
  }
  if (!claims) {
    console.error('Error: --claims is required (JSON string)');
    process.exit(2);
  }

  try {
    // try parse claims JSON
    if (typeof claims === 'string') {
      try { claims = JSON.parse(claims); } catch (e) { throw new Error('claims must be valid JSON'); }
    }

    // initialize admin
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const keyJson = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
      admin.initializeApp({ credential: admin.credential.cert(keyJson) });
    } else if (fs.existsSync('./serviceAccountKey.json')) {
      const keyJson = require('../../serviceAccountKey.json');
      admin.initializeApp({ credential: admin.credential.cert(keyJson) });
    } else {
      console.error('Service account credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_BASE64.');
      process.exit(2);
    }

    const db = admin.firestore();

    const userBefore = await admin.auth().getUser(uid);
    const previousClaims = userBefore.customClaims || {};

    await admin.auth().setCustomUserClaims(uid, claims);

    // mirror to Firestore
    await db.collection('users').doc(uid).set({ claims }, { merge: true });

    // audit log
    await db.collection('admin_audit').add({
      action: 'setClaims',
      actorUid: actor,
      targetUid: uid,
      previousClaims,
      newClaims: claims,
      reason,
      source: 'cli',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Claims updated for', uid);
    process.exit(0);
  } catch (err) {
    console.error('Error setting claims:', err.message || err);
    process.exit(1);
  }
})();
