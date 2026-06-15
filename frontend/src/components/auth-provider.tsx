"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
  fetchMe,
  login,
  loginWithGoogle,
  logout,
  register,
  type User,
} from "@/lib/auth";
import { getStoredUser, getToken } from "@/lib/auth-storage";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUserState(null);
      return;
    }
    const me = await fetchMe();
    setUserState(me);
  }, []);

  useEffect(() => {
    const init = async () => {
      const stored = getStoredUser();
      if (stored) setUserState(stored);
      if (getToken()) {
        try {
          await refreshUser();
        } catch {
          logout();
          setUserState(null);
        }
      }
      setLoading(false);
    };
    void init();
  }, [refreshUser]);

  const value: AuthContextValue = {
    user,
    loading,
    login: async (email, password) => {
      const res = await login(email, password);
      setUserState(res.user);
    },
    register: async (email, password, name) => {
      const res = await register(email, password, name);
      setUserState(res.user);
    },
    loginWithGoogle: async (idToken) => {
      const res = await loginWithGoogle(idToken);
      setUserState(res.user);
    },
    logout: () => {
      logout();
      setUserState(null);
    },
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
