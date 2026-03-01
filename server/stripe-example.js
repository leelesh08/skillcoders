/*
  Stripe Checkout Example (Node.js + Express)

  - POST /checkout  -> create a Checkout Session and return sessionId/url
  - POST /webhook   -> Stripe webhook endpoint to receive events (checkout.session.completed)

  Environment variables:
  - STRIPE_SECRET_KEY      (your Stripe secret key)
  - STRIPE_WEBHOOK_SECRET  (your webhook signing secret)
  - FRONTEND_URL           (frontend base URL for success/cancel redirects)
  - CURRENCY               (optional, default: 'inr')

  Install:
    npm install express stripe body-parser

  Run (example):
    STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx FRONTEND_URL=http://localhost:8081 node server/stripe-example.js
*/

const express = require('express');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

// Temporary admin action key for local testing. Override by setting ADMIN_ACTION_KEY in env.
process.env.ADMIN_ACTION_KEY = process.env.ADMIN_ACTION_KEY || '9346833164';
const stripeApiKey = process.env.STRIPE_SECRET_KEY || '';
const useRealStripe = Boolean(stripeApiKey && !String(stripeApiKey).includes('dummy'));
let stripe;
if (useRealStripe) {
  stripe = new Stripe(stripeApiKey, { apiVersion: '2022-11-15' });
} else {
  console.warn('Stripe secret key not provided or mock detected — running in MOCK stripe mode.');
  // Minimal mock implementation used for local testing when Stripe keys are not configured.
  stripe = {
    checkout: {
      sessions: {
        create: async (opts) => {
          const id = `cs_mock_${Date.now()}`;
          const orderId = opts && opts.metadata && opts.metadata.orderId ? opts.metadata.orderId : '';
          const url = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/mock-checkout?session_id=${id}&orderId=${orderId}`;
          return { id, url };
        },
        retrieve: async (id /*, opts */) => {
          return { id, payment_status: 'paid', metadata: {}, amount_total: 0, line_items: { data: [] } };
        },
      },
    },
    webhooks: {
      constructEvent: (rawBody /*, sig, secret */) => {
        try {
          // bodyParser.raw gives a Buffer
          return JSON.parse(rawBody.toString());
        } catch (e) {
          return rawBody;
        }
      },
    },
    transfers: {
      create: async (args) => ({ id: `tr_mock_${Date.now()}`, ...args }),
    },
  };
}
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Optional Firebase Admin for verifying ID tokens. If not configured,
// admin-key fallback is required for protected endpoints.
let firebaseAdmin = null;
let firebaseAuthAvailable = false;
try {
  const admin = require('firebase-admin');
  // Initialize if credentials provided via GOOGLE_APPLICATION_CREDENTIALS or base64 env
  if (!admin.apps || !admin.apps.length) {
    if (process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64) {
      const creds = JSON.parse(Buffer.from(process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64, 'base64').toString('utf8'));
      admin.initializeApp({ credential: admin.credential.cert(creds) });
    } else {
      // If GOOGLE_APPLICATION_CREDENTIALS is set and points to a file, admin.initializeApp() will use it
      try {
        admin.initializeApp();
      } catch (e) {
        // ignore init errors
      }
    }
  }
  firebaseAdmin = admin;
  firebaseAuthAvailable = true;
  console.log('Firebase Admin detected: invoice downloads will require valid ID tokens');
} catch (e) {
  // firebase-admin not installed or not configured — fall back to admin key check
  firebaseAuthAvailable = false;
}

// Simple orders persistence (mock DB)
const ordersFile = path.join(__dirname, 'orders.json');
const loadOrders = () => {
  try {
    if (!fs.existsSync(ordersFile)) return {};
    const raw = fs.readFileSync(ordersFile, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('Failed to load orders.json', e);
    return {};
  }
};
const saveOrders = (orders) => {
  try {
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save orders.json', e);
  }
};

let orders = loadOrders();
// Audit log file for invoice downloads (JSON lines)
const invoiceAuditFile = path.join(__dirname, 'invoice-downloads.log');

// Simple battles persistence (mock DB)
const battlesFile = path.join(__dirname, 'battles.json');
const loadBattles = () => {
  try {
    if (!fs.existsSync(battlesFile)) return {};
    const raw = fs.readFileSync(battlesFile, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('Failed to load battles.json', e);
    return {};
  }
};
const saveBattles = (battles) => {
  try {
    fs.writeFileSync(battlesFile, JSON.stringify(battles, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save battles.json', e);
  }
};

let battles = loadBattles();

// Simple courses persistence (mock data)
const coursesFile = path.join(__dirname, 'courses.json');
const loadCourses = () => {
  try {
    if (!fs.existsSync(coursesFile)) return [];
    const raw = fs.readFileSync(coursesFile, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load courses.json', e);
    return [];
  }
};
const saveCourses = (arr) => {
  try {
    fs.writeFileSync(coursesFile, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save courses.json', e);
  }
};

let courses = loadCourses();

// Simple quizzes persistence (mock data)
const quizzesFile = path.join(__dirname, 'quizzes.json');
const loadQuizzes = () => {
  try {
    if (!fs.existsSync(quizzesFile)) return [];
    const raw = fs.readFileSync(quizzesFile, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load quizzes.json', e);
    return [];
  }
};
const saveQuizzes = (arr) => {
  try {
    fs.writeFileSync(quizzesFile, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save quizzes.json', e);
  }
};

let quizzes = loadQuizzes();

// Simple users persistence (mock DB)
const usersFile = path.join(__dirname, 'users.json');
const loadUsers = () => {
  try {
    if (!fs.existsSync(usersFile)) return [];
    const raw = fs.readFileSync(usersFile, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load users.json', e);
    return [];
  }
};
const saveUsers = (arr) => {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save users.json', e);
  }
};

let users = loadUsers();

// Basic validation for a course object
const validateCourse = (c) => {
  const errors = [];
  if (!c || typeof c !== 'object') {
    errors.push('course must be an object');
    return { valid: false, errors };
  }
  if (!('id' in c) || c.id === undefined || c.id === null || String(c.id).trim() === '') errors.push('id is required');
  if (!('title' in c) || typeof c.title !== 'string' || c.title.trim() === '') errors.push('title is required');
  if (!('price' in c) || c.price === undefined || c.price === null || isNaN(Number(c.price))) errors.push('price must be a number');
  else if (Number(c.price) < 0) errors.push('price must be >= 0');
  if ('rating' in c && c.rating !== undefined && c.rating !== null) {
    const r = Number(c.rating);
    if (isNaN(r) || r < 0 || r > 5) errors.push('rating must be a number between 0 and 5');
  }
  if ('students' in c && c.students !== undefined && c.students !== null) {
    const s = Number(c.students);
    if (!Number.isInteger(s) || s < 0) errors.push('students must be an integer >= 0');
  }
  if ('level' in c && c.level !== undefined && typeof c.level !== 'string') errors.push('level must be a string');
  if ('category' in c && c.category !== undefined && typeof c.category !== 'string') errors.push('category must be a string');
  return { valid: errors.length === 0, errors };
};

// Use JSON parser for normal routes
app.use(express.json());

// Allow CORS for local development so frontend can POST to webhook
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/**
 * POST /checkout
 * Body examples:
 *  - Create from items:
 *    {
 *      "type": "gadget",
 *      "items": [ { "productId": "g_1", "name": "Gadget A", "price": 499.99, "quantity": 1 } ],
 *      "userId": "user_123"
 *    }
 *
 *  - Simple amount-based (e.g., battles):
 *    { "type": "battle", "id": 12, "amount": 50.0, "userId": "user_123" }
 */
app.post('/checkout', async (req, res) => {
  try {
    const { type, id, amount, items, userId } = req.body || {};
    const currency = (process.env.CURRENCY || 'inr').toLowerCase();

    // Map incoming products into Stripe line_items
    let line_items = [];

    if (Array.isArray(items) && items.length > 0) {
      line_items = items.map((it) => {
        // price expected in major currency units (e.g., INR rupees), convert to smallest unit
        const unitAmount = Math.round((Number(it.price) || 0) * 100);
        return {
          price_data: {
            currency,
            product_data: {
              name: it.name || `item-${it.productId || ''}`,
              metadata: { productId: it.productId || '' },
            },
            unit_amount: unitAmount,
          },
          quantity: Number(it.quantity) || 1,
        };
      });
    } else if (amount) {
      line_items = [
        {
          price_data: {
            currency,
            product_data: { name: `${type || 'purchase'}-${id || ''}` },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ];
    }

    if (line_items.length === 0) return res.status(400).json({ error: 'No items or amount provided' });

    const orderId = crypto.randomUUID();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/cancel`,
      metadata: {
        userId: userId || 'anonymous',
        orderId,
        type: type || '',
        itemId: id ? String(id) : '',
        team: req.body && req.body.team ? String(req.body.team) : '',
      },
    });

    // Save mock order record so we can inspect/fulfill it later
    // Include amount/title/items when provided so gadget orders are persisted with useful info
    const computedAmount = (function () {
      if (typeof amount === 'number' && !isNaN(Number(amount))) return Number(amount);
      if (Array.isArray(items) && items.length > 0) {
        return items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
      }
      return 0;
    })();

    orders[orderId] = {
      orderId,
      userId: userId || 'anonymous',
      type: type || '',
      itemId: id ? String(id) : '',
      title: req.body && req.body.title ? String(req.body.title) : (Array.isArray(items) && items[0] && items[0].name ? String(items[0].name) : ''),
      amount: computedAmount,
      items: Array.isArray(items) ? items : undefined,
      team: req.body && req.body.team ? String(req.body.team) : '',
      sessionId: session.id,
      fulfilled: false,
      createdAt: new Date().toISOString(),
    };
    saveOrders(orders);

    // Return both sessionId and url to support different frontend flows
    res.json({ sessionId: session.id, url: session.url, orderId });
  } catch (err) {
    console.error('Checkout creation failed', err);
    res.status(500).json({ error: (err && err.message) || 'Checkout creation failed' });
  }
});

/**
 * Webhook endpoint to receive events from Stripe
 * Use raw body and Stripe signature verification
 */
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err && err.message);
    return res.status(400).send(`Webhook Error: ${err && err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Checkout session completed:', session.id);
    // Metadata contains userId and orderId
    const { userId, orderId } = session.metadata || {};

    // TODO: fulfill the order: mark as paid in DB, provision product, etc.
    console.log(`Fulfill order ${orderId} for user ${userId}`);
    if (orderId && orders[orderId]) {
      orders[orderId].fulfilled = true;
      orders[orderId].paidAt = new Date().toISOString();
      orders[orderId].sessionId = session.id;
      saveOrders(orders);
      console.log(`Order ${orderId} marked fulfilled in orders.json`);
    }
  }

  res.json({ received: true });
});

// Battles endpoints
app.get('/battles/active', (req, res) => {
  try {
    const list = Object.values(battles).filter((b) => b.active !== false);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/battles/upcoming', (req, res) => {
  try {
    const list = Object.values(battles).filter((b) => b.active === false);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/battles/:id', (req, res) => {
  const { id } = req.params;
  const b = battles[id];
  if (!b) return res.status(404).json({ error: 'Battle not found' });
  res.json(b);
});

app.post('/battles', (req, res) => {
  try {
    const { title, prize, entryFee, creator } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title required' });
    const id = crypto.randomUUID();
    const battle = {
      id,
      title,
      prize: prize || 0,
      entryFee: entryFee || 50,
      creator: creator || 'anonymous',
      viewers: 0,
      participants: [],
      active: true,
      createdAt: new Date().toISOString(),
    };
    battles[id] = battle;
    saveBattles(battles);
    res.json(battle);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/battles/:id/join', (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body || {};
    const b = battles[id];
    if (!b) return res.status(404).json({ error: 'Battle not found' });
    b.viewers = (b.viewers || 0) + 1;
    if (username) b.participants = Array.from(new Set([...(b.participants || []), username]));
    saveBattles(battles);
    res.json(b);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Aliases under /api/battles for API consistency
app.get('/api/battles/active', (req, res) => {
  try {
    const list = Object.values(battles).filter((b) => b.active !== false);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/battles/upcoming', (req, res) => {
  try {
    const list = Object.values(battles).filter((b) => b.active === false);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/battles/:id', (req, res) => {
  const { id } = req.params;
  const b = battles[id];
  if (!b) return res.status(404).json({ error: 'Battle not found' });
  res.json(b);
});

app.post('/api/battles', (req, res) => {
  try {
    const { title, prize, entryFee, creator } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title required' });
    const id = crypto.randomUUID();
    const battle = {
      id,
      title,
      prize: prize || 0,
      entryFee: entryFee || 50,
      creator: creator || 'anonymous',
      viewers: 0,
      participants: [],
      active: true,
      createdAt: new Date().toISOString(),
    };
    battles[id] = battle;
    saveBattles(battles);
    res.json(battle);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/battles/:id/join', (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body || {};
    const b = battles[id];
    if (!b) return res.status(404).json({ error: 'Battle not found' });
    b.viewers = (b.viewers || 0) + 1;
    if (username) b.participants = Array.from(new Set([...(b.participants || []), username]));
    saveBattles(battles);
    res.json(b);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Courses endpoint (mock data)
app.get('/courses', (req, res) => {
  try {
    // Return courses loaded from courses.json (editable)
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// API aliases for courses (prefixed with /api)
app.get('/api/courses', (req, res) => {
  try {
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Quizzes endpoints (public list + admin CRUD)
app.get('/quizzes', (req, res) => {
  try {
    res.json(quizzes);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/quizzes', (req, res) => {
  try {
    res.json(quizzes);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/quizzes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const q = quizzes.find((x) => String(x.id) === String(id));
    if (!q) return res.status(404).json({ error: 'Quiz not found' });
    res.json(q);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Admin create
app.post('/api/quizzes', requireAdminKey, (req, res) => {
  try {
    const quiz = req.body;
    if (!quiz || !quiz.id) return res.status(400).json({ error: 'Quiz with id required' });
    if (quizzes.find((x) => String(x.id) === String(quiz.id))) return res.status(409).json({ error: 'Quiz with this id already exists' });
    quizzes.push(quiz);
    saveQuizzes(quizzes);
    res.status(201).json(quiz);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Admin update
app.put('/api/quizzes/:id', requireAdminKey, (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const idx = quizzes.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Quiz not found' });
    quizzes[idx] = { ...quizzes[idx], ...body, id };
    saveQuizzes(quizzes);
    res.json(quizzes[idx]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Admin delete
app.delete('/api/quizzes/:id', requireAdminKey, (req, res) => {
  try {
    const { id } = req.params;
    const idx = quizzes.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Quiz not found' });
    const removed = quizzes.splice(idx, 1)[0];
    saveQuizzes(quizzes);
    res.json({ removed });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Middleware to require admin action key when ADMIN_ACTION_KEY is configured
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_ACTION_KEY;
  if (!adminKey) return res.status(403).json({ error: 'Admin actions disabled on this server' });
  const headerKey = (req.get('x-admin-action-key') || '').toString();
  if (!headerKey || headerKey !== adminKey) return res.status(403).json({ error: 'Missing or invalid admin action key' });
  return next();
}

// Admin: add or replace courses. Accepts either an array of course objects or a single course object.
app.post('/courses', (req, res) => {
  try {
    const body = req.body;
    if (!body) return res.status(400).json({ error: 'Missing body' });

    // If ADMIN_ACTION_KEY is set, require header for admin actions
    const adminKey = process.env.ADMIN_ACTION_KEY;
    if (adminKey) {
      const headerKey = (req.get('x-admin-action-key') || '').toString();
      if (!headerKey || headerKey !== adminKey) {
        return res.status(403).json({ error: 'Missing or invalid admin action key' });
      }
    }
    if (Array.isArray(body)) {
      // Validate all before replacing
      const allErrors = [];
      body.forEach((it, i) => {
        const v = validateCourse(it);
        if (!v.valid) allErrors.push({ index: i, errors: v.errors });
      });
      if (allErrors.length) return res.status(400).json({ error: 'validation failed', details: allErrors });
      courses = body;
      saveCourses(courses);
      return res.json({ courses });
    }

    // Single course: upsert by id
    const course = body;
    if (!course || !course.id) return res.status(400).json({ error: 'Course object with id required' });

    const v = validateCourse(course);
    if (!v.valid) return res.status(400).json({ error: 'validation failed', details: v.errors });

    const idx = courses.findIndex((c) => String(c.id) === String(course.id));
    if (idx >= 0) {
      courses[idx] = { ...courses[idx], ...course };
    } else {
      courses.push(course);
    }
    saveCourses(courses);
    res.json({ course, courses });
  } catch (e) {
    console.error('Failed to save courses', e);
    res.status(500).json({ error: String(e) });
  }
});

// Admin REST API for courses under /api/admin/courses
app.get('/api/admin/courses', requireAdminKey, (req, res) => {
  try {
    res.json({ courses });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/admin/courses', requireAdminKey, (req, res) => {
  try {
    const course = req.body;
    if (!course) return res.status(400).json({ error: 'Missing course body' });
    const v = validateCourse(course);
    if (!v.valid) return res.status(400).json({ error: 'validation failed', details: v.errors });
    // Prevent duplicate id
    if (courses.find((c) => String(c.id) === String(course.id))) return res.status(409).json({ error: 'Course with this id already exists' });
    courses.push(course);
    saveCourses(courses);
    res.status(201).json({ course });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.put('/api/admin/courses/:id', requireAdminKey, (req, res) => {
  try {
    const { id } = req.params;
    const course = req.body;
    if (!course) return res.status(400).json({ error: 'Missing course body' });
    const v = validateCourse({ ...course, id });
    if (!v.valid) return res.status(400).json({ error: 'validation failed', details: v.errors });
    const idx = courses.findIndex((c) => String(c.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Course not found' });
    courses[idx] = { ...courses[idx], ...course, id };
    saveCourses(courses);
    res.json({ course: courses[idx] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/admin/courses/:id', requireAdminKey, (req, res) => {
  try {
    const { id } = req.params;
    const idx = courses.findIndex((c) => String(c.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Course not found' });
    const removed = courses.splice(idx, 1)[0];
    saveCourses(courses);
    res.json({ removed });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Also expose admin-like routes under /api/courses for convenience when admin key provided
app.post('/api/courses', requireAdminKey, (req, res) => {
  // upsert or bulk replace behavior mirrors /courses POST
  const body = req.body;
  try {
    if (!body) return res.status(400).json({ error: 'Missing body' });
    if (Array.isArray(body)) {
      const allErrors = [];
      body.forEach((it, i) => {
        const v = validateCourse(it);
        if (!v.valid) allErrors.push({ index: i, errors: v.errors });
      });
      if (allErrors.length) return res.status(400).json({ error: 'validation failed', details: allErrors });
      courses = body;
      saveCourses(courses);
      return res.json({ courses });
    }
    const course = body;
    if (!course || !course.id) return res.status(400).json({ error: 'Course object with id required' });
    const v = validateCourse(course);
    if (!v.valid) return res.status(400).json({ error: 'validation failed', details: v.errors });
    const idx = courses.findIndex((c) => String(c.id) === String(course.id));
    if (idx >= 0) {
      courses[idx] = { ...courses[idx], ...course };
    } else {
      courses.push(course);
    }
    saveCourses(courses);
    res.json({ course, courses });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Public users list (sanitized) and admin users API
app.get('/api/users', (req, res) => {
  try {
    // Return users without sensitive fields (passwords)
    const safe = users.map((u) => {
      const { password, ...rest } = u;
      return rest;
    });
    res.json(safe);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/admin/users', requireAdminKey, (req, res) => {
  try {
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/admin/users', requireAdminKey, (req, res) => {
  try {
    const user = req.body;
    if (!user || !user.id || !user.email) return res.status(400).json({ error: 'id and email required' });
    // basic validation
    if (users.find((u) => String(u.id) === String(user.id) || u.email === user.email)) {
      return res.status(409).json({ error: 'User with this id or email already exists' });
    }
    users.push(user);
    saveUsers(users);
    res.status(201).json({ user });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.put('/api/admin/users/:id', requireAdminKey, (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const idx = users.findIndex((u) => String(u.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    users[idx] = { ...users[idx], ...body, id };
    saveUsers(users);
    res.json({ user: users[idx] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/admin/users/:id', requireAdminKey, (req, res) => {
  try {
    const { id } = req.params;
    const idx = users.findIndex((u) => String(u.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const removed = users.splice(idx, 1)[0];
    saveUsers(users);
    res.json({ removed });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Retrieve a checkout session and its metadata
app.get('/session/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // expand line_items to access products if needed
    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ['line_items.data.price.product'],
    });
    res.json({ session });
  } catch (err) {
    console.error('Failed to retrieve session', err);
    res.status(500).json({ error: (err && err.message) || 'Failed to retrieve session' });
  }
});

// Orders endpoints (mock persistence)
app.get('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orders[orderId];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

app.put('/orders/:orderId/fulfill', (req, res) => {
  const { orderId } = req.params;
  const order = orders[orderId];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.fulfilled = true;
  order.fulfilledBy = 'manual';
  order.fulfilledAt = new Date().toISOString();
  saveOrders(orders);
  res.json({ order });
});

/**
 * PUT /orders/:orderId/winner
 * Body: { winnerUserId?: string, winnerTeam?: string, payoutAmount?: number }
 * Marks a winner for a battle order and attempts to trigger a payout.
 * If `STRIPE_PAYOUT_ACCOUNT` is configured, attempts a Stripe transfer (Connect).
 * Otherwise records a mock payout in orders.json.
 */
app.put('/orders/:orderId/winner', async (req, res) => {
  const { orderId } = req.params;
  const order = orders[orderId];
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { winnerUserId, winnerTeam, payoutAmount } = req.body || {};
  const payout = typeof payoutAmount === 'number' ? payoutAmount : (order.prize || order.amount || 0);

  order.winner = {
    userId: winnerUserId || order.userId || 'unknown',
    team: winnerTeam || order.team || null,
    amount: payout,
    markedAt: new Date().toISOString(),
  };

  // Attempt Stripe transfer if configured
  const connectedAccount = process.env.STRIPE_PAYOUT_ACCOUNT;
  if (connectedAccount && stripe) {
    try {
      // Transfers require available balance and Connect setup; this is best-effort in example.
      const amountMinor = Math.round(Number(payout) * 100);
      const transfer = await stripe.transfers.create({
        amount: amountMinor,
        currency: (process.env.CURRENCY || 'inr').toLowerCase(),
        destination: connectedAccount,
        metadata: { orderId, reason: 'battle_prize' },
      });
      order.payout = { status: 'transferred', transferId: transfer.id, raw: transfer };
      order.paidOut = true;
      order.paidOutAt = new Date().toISOString();
      saveOrders(orders);
      return res.json({ order, transfer });
    } catch (err) {
      console.error('Stripe transfer failed', err);
      order.payout = { status: 'failed', error: (err && err.message) || String(err) };
      saveOrders(orders);
      return res.status(500).json({ error: 'Payout failed', details: order.payout });
    }
  }

  // Mock payout
  order.payout = { status: 'mocked', info: 'No STRIPE_PAYOUT_ACCOUNT configured; marked as paid locally' };
  order.paidOut = true;
  order.paidOutAt = new Date().toISOString();
  saveOrders(orders);
  res.json({ order });
});

// Generate a simple invoice PDF for an order (returns Uint8Array)
async function generateInvoicePdf(order) {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pageWidth = 595; // A4-ish
  const pageHeight = 842;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 60;

  // Try embed logo from public/logo.png (optional)
  try {
    const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      let logoImage;
      if (logoPath.toLowerCase().endsWith('.png')) {
        logoImage = await pdfDoc.embedPng(logoBytes);
      } else {
        logoImage = await pdfDoc.embedJpg(logoBytes);
      }
      const lw = 120;
      const lh = (logoImage.height / logoImage.width) * lw;
      page.drawImage(logoImage, { x: 40, y: pageHeight - 40 - lh, width: lw, height: lh });
    }
  } catch (e) {
    // ignore logo errors
  }

  // Header
  page.drawText('Invoice', { x: 200, y: pageHeight - 50, size: 24, font: helvetica, color: rgb(0, 0, 0) });

  // Order metadata
  const left = 40;
  y -= 40;
  page.drawText(`Order ID: ${order.orderId || ''}`, { x: left, y, size: 12, font: helvetica });
  y -= 18;
  page.drawText(`User: ${order.userId || 'anonymous'}`, { x: left, y, size: 12, font: helvetica });
  y -= 18;
  page.drawText(`Type: ${order.type || ''}`, { x: left, y, size: 12, font: helvetica });
  y -= 18;
  page.drawText(`Created: ${order.createdAt || ''}`, { x: left, y, size: 12, font: helvetica });
  y -= 24;

  // Items table header
  page.drawText('Items', { x: left, y, size: 14, font: helvetica });
  y -= 18;

  const drawLine = (text) => {
    if (y < 80) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 60;
    }
    page.drawText(text, { x: left + 10, y, size: 11, font: helvetica });
    y -= 16;
  };

  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach((it, idx) => {
      const line = `${idx + 1}. ${it.name || it.productId || ''} x${it.quantity || 1} - ${it.price != null ? it.price : ''}`;
      drawLine(line);
    });
  } else if (order.title) {
    drawLine(order.title + (order.amount != null ? ` — ₹${order.amount}` : ''));
  }

  // Summary
  if (y < 120) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - 100;
  } else {
    y -= 12;
  }
  const currencyLabel = (process.env.CURRENCY || 'INR').toUpperCase();
  page.drawText(`Total: ${order.amount != null ? `${order.amount} ${currencyLabel}` : '0'}`, { x: left, y, size: 14, font: helvetica });

  return await pdfDoc.save();
}

// Serve generated invoice PDF for an order
app.get('/orders/:orderId/invoice', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders[orderId];
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Authorization: prefer Firebase ID token verification when available.
    const authHeader = (req.get('authorization') || '').toString();
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (firebaseAuthAvailable) {
      if (!bearer) return res.status(401).json({ error: 'Missing Authorization Bearer token' });
      try {
        const decoded = await firebaseAdmin.auth().verifyIdToken(bearer);
        // Allow if token uid matches order.userId, or token has admin claim
        const isAdmin = !!(decoded.admin || decoded.isAdmin || decoded.role === 'admin');
        if (decoded.uid !== order.userId && !isAdmin) {
          return res.status(403).json({ error: 'Forbidden: token does not match order owner' });
        }
      } catch (e) {
        console.error('Failed to verify ID token for invoice download', e && e.message);
        return res.status(401).json({ error: 'Invalid or expired ID token' });
      }
    } else if (process.env.ADMIN_ACTION_KEY) {
      // Fallback: require admin action key header when firebase-admin not configured
      const headerKey = (req.get('x-admin-action-key') || '').toString();
      if (!headerKey || headerKey !== process.env.ADMIN_ACTION_KEY) {
        return res.status(403).json({ error: 'Missing or invalid admin action key' });
      }
    } else {
      // Server not configured for auth enforcement — do not allow invoice downloads
      return res.status(403).json({ error: 'Invoice download protected: configure Firebase Admin or set ADMIN_ACTION_KEY' });
    }

    // Audit the download: who requested it, when, and request metadata
    try {
      const headerKey = (req.get('x-admin-action-key') || '').toString();
      let actorId = 'unknown';
      let authMethod = 'unknown';
      if (firebaseAuthAvailable) {
        try {
          const decoded2 = await firebaseAdmin.auth().verifyIdToken(bearer);
          actorId = decoded2.uid || 'unknown';
          authMethod = 'firebase';
        } catch (e) {
          // ignore; verification was already attempted earlier
        }
      } else if (process.env.ADMIN_ACTION_KEY && headerKey === process.env.ADMIN_ACTION_KEY) {
        actorId = 'admin';
        authMethod = 'admin-key';
      }

      const auditEntry = {
        timestamp: new Date().toISOString(),
        orderId,
        actor: actorId,
        authMethod,
        ip: (req.get('x-forwarded-for') || req.ip || (req.connection && req.connection.remoteAddress) || ''),
        userAgent: (req.get('user-agent') || ''),
        route: req.originalUrl || req.url,
        method: req.method,
      };

      // Append to audit log file (JSON lines)
      try {
        fs.appendFileSync(invoiceAuditFile, JSON.stringify(auditEntry) + '\n', 'utf8');
      } catch (e) {
        console.error('Failed to write invoice audit log', e && e.message);
      }

      // Also record in orders.json for quick reference
      try {
        orders[orderId].invoiceDownloads = orders[orderId].invoiceDownloads || [];
        orders[orderId].invoiceDownloads.push(auditEntry);
        saveOrders(orders);
      } catch (e) {
        console.error('Failed to record invoice download on order', e && e.message);
      }
    } catch (e) {
      console.error('Invoice audit failed', e && e.message);
    }

    const pdfBytes = await generateInvoicePdf(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
    return res.send(Buffer.from(pdfBytes));
  } catch (e) {
    console.error('Failed to generate invoice', e);
    res.status(500).json({ error: (e && e.message) || 'Failed to generate invoice' });
  }
});

// Admin endpoint: query invoice audit log entries
// GET /admin/invoice-audits?orderId=<id>&limit=100&offset=0
app.get('/admin/invoice-audits', async (req, res) => {
  try {
    // Auth: require firebase admin with admin claim, or ADMIN_ACTION_KEY header
    const authHeader = (req.get('authorization') || '').toString();
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (firebaseAuthAvailable) {
      if (!bearer) return res.status(401).json({ error: 'Missing Authorization Bearer token' });
      try {
        const decoded = await firebaseAdmin.auth().verifyIdToken(bearer);
        const isAdmin = !!(decoded.admin || decoded.isAdmin || decoded.role === 'admin');
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden: admin claim required' });
      } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired ID token' });
      }
    } else if (process.env.ADMIN_ACTION_KEY) {
      const headerKey = (req.get('x-admin-action-key') || '').toString();
      if (!headerKey || headerKey !== process.env.ADMIN_ACTION_KEY) return res.status(403).json({ error: 'Missing or invalid admin action key' });
    } else {
      return res.status(403).json({ error: 'Admin auth not configured' });
    }

    const { orderId } = req.query || {};
    const limit = Math.min(1000, Number(req.query.limit || 100));
    const offset = Math.max(0, Number(req.query.offset || 0));

    let entries = [];
    try {
      if (fs.existsSync(invoiceAuditFile)) {
        const raw = fs.readFileSync(invoiceAuditFile, 'utf8');
        entries = raw.split('\n').filter(Boolean).map((line) => {
          try { return JSON.parse(line); } catch (e) { return null; }
        }).filter(Boolean);
      }
    } catch (e) {
      console.error('Failed to read invoice audit file', e && e.message);
    }

    // Also include any entries stored on orders.json for completeness
    try {
      Object.values(orders).forEach((o) => {
        if (o && Array.isArray(o.invoiceDownloads)) {
          o.invoiceDownloads.forEach((e) => entries.push(e));
        }
      });
    } catch (e) {
      // ignore
    }

    // Deduplicate by JSON string
    const seen = new Set();
    entries = entries.filter((e) => {
      const k = JSON.stringify(e);
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });

    if (orderId) entries = entries.filter((e) => String(e.orderId) === String(orderId));

    const total = entries.length;
    const page = entries.slice(offset, offset + limit);

    res.json({ total, offset, limit, items: page });
  } catch (e) {
    console.error('Failed to query invoice audits', e);
    res.status(500).json({ error: (e && e.message) || 'Failed to query invoice audits' });
  }
});

app.listen(PORT, () => console.log(`Stripe example server listening on http://localhost:${PORT}`));
