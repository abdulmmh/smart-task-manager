import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bm_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate authentication state on page load or refresh
  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('bm_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        setUser(response.user);
      } catch (error) {
        console.error('[AuthContext] Session expired or invalid token:', error.message);
        localStorage.removeItem('bm_token');
        localStorage.removeItem('bm_user');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('bm_token', data.token);
    localStorage.setItem('bm_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    localStorage.setItem('bm_token', data.token);
    localStorage.setItem('bm_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('bm_token');
    localStorage.removeItem('bm_user');
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
