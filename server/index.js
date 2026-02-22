require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { google } = require('googleapis');

// Initialize Firebase Admin SDK
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  const keyJson = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
  admin.initializeApp({ credential: admin.credential.cert(keyJson) });
} else {
  try {
    admin.initializeApp();
  } catch (e) {
    console.warn('Firebase Admin not initialized — provide service account via GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_BASE64');
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Firestore reference
const db = admin.firestore();

// Auth middleware: extract ID token from Authorization header or body and verify
async function authenticate(req, res, next) {
  const authHeader = req.get('Authorization') || '';
  let token = null;
  if (authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
  if (!token && req.body && req.body.idToken) token = req.body.idToken;
  if (!token) return res.status(401).json({ error: 'Missing authentication token' });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', detail: err.message });
  }
}

// Admin-check middleware: requires `admin` custom claim or `roles` containing 'admin'
function requireAdmin(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  if (user.admin === true) return next();
  const roles = user.roles || user.role;
  if (Array.isArray(roles) && roles.includes('admin')) return next();
  if (typeof roles === 'string' && roles === 'admin') return next();
  return res.status(403).json({ error: 'Admin role required' });
}

// Simple helper to return 404 when doc not found
function docToData(doc) {
  if (!doc || !doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// Routes for common pages/resources

// Users: get or create profile
app.get('/users/:uid', authenticate, async (req, res) => {
  const { uid } = req.params;
  try {
    // only allow owner or admin to read profile
    if (req.user?.uid !== uid && req.user?.admin !== true && !(Array.isArray(req.user?.roles) && req.user.roles.includes('admin'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const snap = await db.collection('users').doc(uid).get();
    const data = docToData(snap);
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', authenticate, async (req, res) => {
  const payload = req.body;
  if (!payload || !payload.uid) return res.status(400).json({ error: 'uid required' });
  try {
    await db.collection('users').doc(payload.uid).set(payload, { merge: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic CRUD helper generator for collections
function collectionRoutes(collectionName) {
  const base = `/${collectionName}`;

  // List
  app.get(base, async (req, res) => {
    try {
      const snap = await db.collection(collectionName).get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get one
  app.get(`${base}/:id`, async (req, res) => {
    try {
      const snap = await db.collection(collectionName).doc(req.params.id).get();
      const data = docToData(snap);
      if (!data) return res.status(404).json({ error: 'Not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create (admin only)
  app.post(base, authenticate, requireAdmin, async (req, res) => {
    try {
      const data = req.body || {};
      const docRef = await db.collection(collectionName).add({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      const snap = await docRef.get();
      res.status(201).json({ id: docRef.id, ...snap.data() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update
  // Update — allow owner or admin
  async function authorizeOwnerOrAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    try {
      const snap = await db.collection(collectionName).doc(req.params.id).get();
      if (!snap.exists) return res.status(404).json({ error: 'Not found' });
      const data = snap.data() || {};
      const possibleOwners = [data.ownerUid, data.owner, data.createdBy, data.uid, data.userUid];
      const isOwner = possibleOwners.some((v) => v && v === req.user.uid);
      const isAdmin = req.user?.admin === true || (Array.isArray(req.user?.roles) && req.user.roles.includes('admin')) || req.user?.role === 'admin';
      if (isAdmin || isOwner) return next();
      return res.status(403).json({ error: 'Forbidden' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  app.put(`${base}/:id`, authenticate, authorizeOwnerOrAdmin, async (req, res) => {
    try {
      const data = req.body || {};
      await db.collection(collectionName).doc(req.params.id).set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      const snap = await db.collection(collectionName).doc(req.params.id).get();
      res.json({ id: snap.id, ...snap.data() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete — allow owner or admin
  app.delete(`${base}/:id`, authenticate, authorizeOwnerOrAdmin, async (req, res) => {
    try {
      await db.collection(collectionName).doc(req.params.id).delete();
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

['courses', 'quizzes', 'meetings', 'gadgets', 'labs', 'careers', 'battles'].forEach(collectionRoutes);

// Instructor applications (simple create)
app.post('/instructor/apply', authenticate, async (req, res) => {
  try {
    const data = req.body || {};
    data.createdAt = admin.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection('instructor_applications').add(data);
    res.status(201).json({ id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simple leaderboard for battles
app.get('/battles/leaderboard', async (req, res) => {
  try {
    const snap = await db.collection('battles').orderBy('score', 'desc').limit(50).get();
    res.json({ items: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: set or remove custom claims for a user
app.post('/admin/users/:uid/claims', authenticate, requireAdmin, async (req, res) => {
  const { uid } = req.params;
  const claims = req.body && req.body.claims ? req.body.claims : null;
  if (!claims) return res.status(400).json({ error: 'claims object required in body' });
  // If ADMIN_ACTION_KEY is set, require matching header for extra protection
  const adminKey = process.env.ADMIN_ACTION_KEY;
  if (adminKey) {
    const headerKey = (req.get('x-admin-action-key') || '').toString();
    if (!headerKey || headerKey !== adminKey) {
      return res.status(403).json({ error: 'Missing or invalid admin action key' });
    }
  }
  try {
    const userRecordBefore = await admin.auth().getUser(uid);
    const previousClaims = userRecordBefore.customClaims || {};

    await admin.auth().setCustomUserClaims(uid, claims);
    // Mirror claims in Firestore user document
    await db.collection('users').doc(uid).set({ claims }, { merge: true });

    // Audit log
    await db.collection('admin_audit').add({
      action: 'setClaims',
      actorUid: req.user?.uid || null,
      targetUid: uid,
      previousClaims,
      newClaims: claims,
      reason: req.body.reason || null,
      source: 'admin-api',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ ok: true, uid, claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: read custom claims for a user
app.get('/admin/users/:uid/claims', authenticate, requireAdmin, async (req, res) => {
  const { uid } = req.params;
  try {
    const userRecord = await admin.auth().getUser(uid);
    res.json({ uid, customClaims: userRecord.customClaims || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify ID token (client sends Firebase ID token)
app.post('/verifyToken', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken required' });
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    res.json({ uid: decoded.uid, decoded });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// List Cloud SQL instances (uses Application Default Credentials or service account)
app.get('/instances', async (req, res) => {
  const projectId = process.env.GCP_PROJECT_ID || req.query.projectId;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });
  try {
    const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const authClient = await auth.getClient();
    const sqladmin = google.sqladmin({ version: 'v1beta4', auth: authClient });
    const result = await sqladmin.instances.list({ project: projectId });
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
}

module.exports = app;
