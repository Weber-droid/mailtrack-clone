import { apiFetch } from "@/lib/api";
import {
  type AuthResponse,
  clearToken,
  getToken,
  setToken,
  setUser,
  type User,
} from "@/lib/auth-storage";

export type { User, AuthResponse };

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
    auth: false,
  });
  setToken(res.access_token);
  setUser(res.user);
  return res;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
  });
  setToken(res.access_token);
  setUser(res.user);
  return res;
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
    auth: false,
  });
  setToken(res.access_token);
  setUser(res.user);
  return res;
}

export async function fetchMe(): Promise<User> {
  const user = await apiFetch<User>("/api/auth/me");
  setUser(user);
  return user;
}

export async function updateSettings(data: Partial<User>): Promise<User> {
  return apiFetch<User>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function completeOnboarding(): Promise<User> {
  return updateSettings({ onboarding_completed: true } as Partial<User>);
}

export function logout(): void {
  clearToken();
  localStorage.removeItem("sendbeacon_user");
  localStorage.removeItem("mailtrack_user");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
