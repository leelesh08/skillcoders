import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../Login';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

let fetchMock: ReturnType<typeof vi.fn>;

// Mock firebase auth and getIdToken
vi.mock('@/lib/firebase', () => ({ 
  auth: {},
  signInWithEmailAndPassword: vi.fn(async (auth, email, password) => ({
    user: { getIdToken: async () => 'fake-id-token' },
  })),
}));

describe('Login page', () => {
  beforeEach(() => {
    // mock fetch
    fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ uid: 'test' }) }));
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('submits credentials and posts idToken to backend', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const button = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'me@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(button);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // access the mock created in beforeEach via the global fetch reference
    const [url, opts] = (fetchMock as any).mock.calls[0];
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body).toHaveProperty('idToken', 'fake-id-token');
  });
});
