import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/api';
import type { RegisterInput, User } from '../types';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterInput) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = 'tendersetu_token';
const USER_KEY = 'tendersetu_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);
    if (storedToken) setToken(storedToken);
    if (storedUser) setUser(JSON.parse(storedUser) as User);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    setToken(response.token);
    setUser(response.user);
    window.localStorage.setItem(TOKEN_KEY, response.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  };

  const register = async (payload: RegisterInput) => {
    const response = await api.register(payload);
    setToken(response.token);
    setUser(response.user);
    window.localStorage.setItem(TOKEN_KEY, response.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  };

  const value = useMemo(
    () => ({ token, user, login, register, logout, isAuthenticated: Boolean(token) }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
