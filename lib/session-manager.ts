import type { SessionTokenResponse } from "./ai/odai-types";

const SESSION_STORAGE_KEY = "odai_session";

export interface StoredSession {
  sessionToken: string;
  expiresAt: string;
  quotaRemaining: number;
  quotaLimit: number;
}

export function saveSession(data: SessionTokenResponse): void {
  if (typeof window === "undefined") return;

  const session: StoredSession = {
    sessionToken: data.session_token,
    expiresAt: data.expires_at,
    quotaRemaining: data.quota_remaining,
    quotaLimit: data.quota,
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save session:", error);
  }
}

export function getSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const session: StoredSession = JSON.parse(stored);

    const expiresAt = new Date(session.expiresAt);
    const now = new Date();

    if (expiresAt <= now) {
      clearSession();
      return null;
    }

    if (session.quotaRemaining <= 0) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
}

export function isSessionValid(): boolean {
  return getSession() !== null;
}

export function updateSessionQuota(quotaRemaining: number): void {
  if (typeof window === "undefined") return;

  const session = getSession();
  if (!session) return;

  session.quotaRemaining = quotaRemaining;

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to update session quota:", error);
  }
}

