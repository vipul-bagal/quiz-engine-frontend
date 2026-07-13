import { createContext, useContext, useState, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

const TOKEN_KEY = 'quiz_engine_token';
const USER_KEY = 'quiz_engine_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const persistSession = useCallback((authResponse) => {
    // authResponse: { token, email, role }
    localStorage.setItem(TOKEN_KEY, authResponse.token);
    const userInfo = { email: authResponse.email, role: authResponse.role };
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    persistSession(data);
    return data;
  }, [persistSession]);

  const register = useCallback(async (details) => {
    const data = await authApi.register(details);
    persistSession(data);
    return data;
  }, [persistSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
