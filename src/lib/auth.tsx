'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './apiClient';
import type { LoginResponse, Role } from './models/user.model';

const TOKEN_KEY = 'siipe_token';
const USER_KEY = 'siipe_user';

function loadUser(): LoginResponse | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

function getTokenExpiration(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: LoginResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  isAdmin: () => boolean;
  isDelegue: () => boolean;
  isAssistanteSociale: () => boolean;
  canDelete: () => boolean;
  canManagePersonnel: () => boolean;
  canEditPersonnel: () => boolean;
  canManageBeneficiaires: () => boolean;
  canDeleteBeneficiaire: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MAX_DELAY = 2_147_483_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push('/auth/login');
  }, [router]);

  const scheduleAutoLogout = useCallback(() => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    const token = localStorage.getItem(TOKEN_KEY);
    const expiration = getTokenExpiration(token);
    if (expiration === null) return;
    const delay = expiration - Date.now();
    if (delay <= 0) {
      logout();
      return;
    }
    logoutTimer.current = setTimeout(scheduleAutoLogout, Math.min(delay, MAX_DELAY));
  }, [logout]);

  useEffect(() => {
    setUser(loadUser());
    scheduleAutoLogout();
    setLoading(false);
    return () => { if (logoutTimer.current) clearTimeout(logoutTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login({ email, password });
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    setUser(response);
    scheduleAutoLogout();
  }, [scheduleAutoLogout]);

  const hasRole = useCallback((role: Role) => user?.role === role, [user]);
  const hasAnyRole = useCallback((roles: Role[]) => !!user && roles.some(r => r === user.role), [user]);
  const isAdmin = useCallback(() => hasRole('ROLE_ADMIN'), [hasRole]);
  const isDelegue = useCallback(() => hasRole('ROLE_DELEGUE'), [hasRole]);
  const isAssistanteSociale = useCallback(() => hasRole('ROLE_ASSISTANTE_SOCIALE'), [hasRole]);
  const canDelete = useCallback(() => hasAnyRole(['ROLE_ADMIN', 'ROLE_DELEGUE']), [hasAnyRole]);
  const canManagePersonnel = useCallback(() => hasAnyRole([
    'ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE', 'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE'
  ]), [hasAnyRole]);
  const canEditPersonnel = useCallback(() => hasAnyRole([
    'ROLE_ADMIN', 'ROLE_CHEF_SERVICE', 'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE'
  ]), [hasAnyRole]);
  const canManageBeneficiaires = useCallback(() => hasAnyRole(['ROLE_ADMIN', 'ROLE_ASSISTANTE_SOCIALE']), [hasAnyRole]);
  const canDeleteBeneficiaire = useCallback(() => hasAnyRole(['ROLE_ADMIN', 'ROLE_ASSISTANTE_SOCIALE']), [hasAnyRole]);

  const isAuthenticated = !!user && (() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    const exp = getTokenExpiration(token);
    return exp === null ? true : Date.now() < exp;
  })();

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, loading, login, logout,
      hasRole, hasAnyRole, isAdmin, isDelegue, isAssistanteSociale,
      canDelete, canManagePersonnel, canEditPersonnel, canManageBeneficiaires, canDeleteBeneficiaire
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
