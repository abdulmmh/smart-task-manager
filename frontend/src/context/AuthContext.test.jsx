import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '../api/authApi';

vi.mock('../api/authApi', () => ({
  authApi: { getMe: vi.fn(), login: vi.fn(), register: vi.fn() },
}));

function Probe() {
  const { user } = useAuth();
  return <div data-testid="who">{user ? user.email : 'signed-out'}</div>;
}

const cachedUser = { id: 'u1', email: 'alex.admin@brightmind.com', role: 'admin' };

async function mountAndWaitForRevalidation() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  await waitFor(() => expect(authApi.getMe).toHaveBeenCalledTimes(1));
  await new Promise((resolve) => setTimeout(resolve, 0)); // let the rejected promise settle
}

describe('AuthContext background session revalidation', () => {
  afterEach(() => {
    cleanup(); // unmount between tests (Testing Library only auto-cleans when Vitest globals are enabled)
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('bm_token', 'valid.jwt.token');
    localStorage.setItem('bm_user', JSON.stringify(cachedUser));
  });

  it('keeps the cached session when the API is unreachable (network error / cold start)', async () => {
    authApi.getMe.mockRejectedValue(new Error('Network Error')); // axios error without a response
    await mountAndWaitForRevalidation();
    expect(screen.getByTestId('who').textContent).toBe(cachedUser.email);
    expect(localStorage.getItem('bm_token')).toBe('valid.jwt.token');
  });

  it('keeps the cached session when the server answers 503', async () => {
    authApi.getMe.mockRejectedValue(Object.assign(new Error('Service Unavailable'), { response: { status: 503 } }));
    await mountAndWaitForRevalidation();
    expect(screen.getByTestId('who').textContent).toBe(cachedUser.email);
    expect(localStorage.getItem('bm_token')).toBe('valid.jwt.token');
  });

  it('signs the user out when the token is rejected with 401', async () => {
    authApi.getMe.mockRejectedValue(Object.assign(new Error('Unauthorized'), { response: { status: 401 } }));
    await mountAndWaitForRevalidation();
    await waitFor(() => expect(screen.getByTestId('who').textContent).toBe('signed-out'));
    expect(localStorage.getItem('bm_token')).toBeNull();
    expect(localStorage.getItem('bm_user')).toBeNull();
  });

  it('refreshes the cached user with the copy returned by /auth/me', async () => {
    authApi.getMe.mockResolvedValue({ user: { ...cachedUser, name: 'Fresh Name' } });
    await mountAndWaitForRevalidation();
    await waitFor(() => expect(JSON.parse(localStorage.getItem('bm_user')).name).toBe('Fresh Name'));
  });
});