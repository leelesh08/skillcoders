const request = require('supertest');

// Mock firebase-admin and Firestore interactions
const addMock = jest.fn().mockResolvedValue(true);
const setCustomUserClaimsMock = jest.fn().mockResolvedValue(true);
const getUserMock = jest.fn().mockResolvedValue({ uid: 'target', customClaims: {} });

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: { applicationDefault: jest.fn(), cert: jest.fn() },
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'admin-uid', admin: true }),
    setCustomUserClaims: setCustomUserClaimsMock,
    getUser: getUserMock,
  }),
  firestore: () => ({
    collection: () => ({
      doc: () => ({ get: async () => ({ exists: false }) , set: jest.fn().mockResolvedValue(true)}),
      add: addMock,
    }),
    FieldValue: { serverTimestamp: () => ({}) },
  }),
}));

const app = require('../index');

describe('Admin audit logging', () => {
  test('POST /admin/users/:uid/claims writes audit log', async () => {
    const resp = await request(app)
      .post('/admin/users/target/claims')
      .send({ claims: { admin: true }, reason: 'test' })
      .set('Accept', 'application/json');

    expect(resp.statusCode).toBe(200);
    expect(setCustomUserClaimsMock).toHaveBeenCalledWith('target', { admin: true });
    expect(addMock).toHaveBeenCalled();
  });
});
