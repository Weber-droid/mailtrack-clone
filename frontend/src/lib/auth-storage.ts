const TOKEN_KEY = "sendbeacon_token";
const LEGACY_TOKEN_KEY = "mailtrack_token";
const USER_KEY = "sendbeacon_user";
const LEGACY_USER_KEY = "mailtrack_user";

export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  onboarding_completed: boolean;
  track_opens_default: boolean;
  track_links_default: boolean;
  append_disclosure: boolean;
  disclosure_text: string | null;
  tracking_domain: string | null;
  webhook_url: string | null;
  retention_days: number | null;
  is_admin: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

function migrateLegacyStorage(): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(TOKEN_KEY) && localStorage.getItem(LEGACY_TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, localStorage.getItem(LEGACY_TOKEN_KEY)!);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
  if (!localStorage.getItem(USER_KEY) && localStorage.getItem(LEGACY_USER_KEY)) {
    localStorage.setItem(USER_KEY, localStorage.getItem(LEGACY_USER_KEY)!);
    localStorage.removeItem(LEGACY_USER_KEY);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  migrateLegacyStorage();
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  migrateLegacyStorage();
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
