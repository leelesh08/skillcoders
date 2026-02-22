const request = require('supertest');

let currentDecoded = null;
let getMock, setMock, deleteMock;

jest.mock('firebase-admin', () => {
  getMock = jest.fn();
  setMock = jest.fn();
  deleteMock = jest.fn();

  const verifyIdToken = jest.fn(async (token) => currentDecoded);

  return {
    initializeApp: jest.fn(),
    credential: { applicationDefault: jest.fn(), cert: jest.fn() },
    auth: () => ({ verifyIdToken, setCustomUserClaims: jest.fn(), getUser: jest.fn() }),
    firestore: () => ({
      collection: () => ({
        doc: () => ({ get: getMock, set: setMock, delete: deleteMock }),
        add: jest.fn().mockResolvedValue(true),
      }),
      FieldValue: { serverTimestamp: () => ({}) },
    }),
  };
});

const app = require('../index');

describe('RBAC owner-or-admin checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default doc exists
    getMock.mockImplementation(async () => ({ exists: true, data: () => ({ ownerUid: 'owner-uid' }) }));
    setMock.mockResolvedValue(true);
    deleteMock.mockResolvedValue(true);
  });

  test('owner can update document', async () => {
    currentDecoded = { uid: 'owner-uid' };

    const res = await request(app)
      .put('/courses/abc')
      .send({ title: 'updated' })
      .set('Authorization', 'Bearer faketoken');

    expect(res.statusCode).toBe(200);
    expect(setMock).toHaveBeenCalled();
  });

  test('non-owner non-admin cannot delete document', async () => {
    currentDecoded = { uid: 'other-uid' };

    const res = await request(app)
      .delete('/courses/abc')
      .set('Authorization', 'Bearer faketoken');

    expect(res.statusCode).toBe(403);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  test('admin can delete document', async () => {
    currentDecoded = { uid: 'admin-uid', admin: true };

    const res = await request(app)
      .delete('/courses/abc')
      .set('Authorization', 'Bearer faketoken');

    expect(res.statusCode).toBe(200);
    expect(deleteMock).toHaveBeenCalled();
  });
});
