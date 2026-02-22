const request = require('supertest');

// Mock firebase-admin before requiring the app
jest.mock('firebase-admin', () => {
  const verifyIdToken = jest.fn().mockResolvedValue({ uid: 'test-uid' });
  return {
    initializeApp: jest.fn(),
    credential: { applicationDefault: jest.fn(), cert: jest.fn() },
    auth: () => ({ verifyIdToken }),
  };
});

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    sqladmin: jest.fn().mockReturnValue({
      instances: {
        list: jest.fn().mockResolvedValue({ data: { items: [{ name: 'instance-1' }] } }),
      },
    }),
  },
}));

const app = require('../index');

describe('Backend endpoints', () => {
  test('POST /verifyToken returns decoded uid', async () => {
    const res = await request(app)
      .post('/verifyToken')
      .send({ idToken: 'fake-token' })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('uid', 'test-uid');
  });

  test('GET /instances returns instances list', async () => {
    const res = await request(app).get('/instances').query({ projectId: 'my-proj' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
