import type {
  AccessCodeRequest,
  SessionStatusResponse,
  SessionTokenResponse,
  TokenRevokeRequest,
} from "./odai-types";

let sessionCache: {
  sessionToken: string;
  expiresAt: Date;
  quotaRemaining: number;
  quotaLimit: number;
} | null = null;

const ODAI_API_BASE_URL =
  process.env.ODAI_API_BASE_URL || "http://45.63.92.192:52847";

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export async function authenticateWithAccessCode(
  accessCode: string
): Promise<SessionTokenResponse> {
  const requestBody: AccessCodeRequest = {
    access_code: accessCode,
  };

  const response = await fetch(`${ODAI_API_BASE_URL}/v1/auth/access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AuthenticationError(
      `Authentication failed: ${errorText}`,
      response.status
    );
  }

  const data: SessionTokenResponse = await response.json();

  sessionCache = {
    sessionToken: data.session_token,
    expiresAt: new Date(data.expires_at),
    quotaRemaining: data.quota_remaining,
    quotaLimit: data.quota,
  };

  return data;
}

export async function getSessionStatus(
  sessionToken: string
): Promise<SessionStatusResponse> {
  const response = await fetch(`${ODAI_API_BASE_URL}/v1/session/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AuthenticationError(
      `Session status check failed: ${errorText}`,
      response.status
    );
  }

  return response.json();
}

export async function revokeToken(sessionToken: string): Promise<void> {
  const requestBody: TokenRevokeRequest = {
    session_token: sessionToken,
  };

  const response = await fetch(`${ODAI_API_BASE_URL}/v1/token/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AuthenticationError(
      `Token revocation failed: ${errorText}`,
      response.status
    );
  }

  clearSessionCache();
}

export async function getSessionToken(): Promise<string> {
  const preConfiguredToken = process.env.ODAI_ACCESS_TOKEN;
  if (preConfiguredToken) {
    return preConfiguredToken;
  }

  if (!sessionCache) {
    throw new AuthenticationError(
      "No active session. Please authenticate with an access code.",
      401
    );
  }

  const now = new Date();
  if (sessionCache.expiresAt <= now) {
    clearSessionCache();
    throw new AuthenticationError("Session expired. Please re-authenticate.", 401);
  }

  if (sessionCache.quotaRemaining <= 0) {
    throw new AuthenticationError(
      "Quota exceeded. Please use a new access code.",
      429
    );
  }

  return sessionCache.sessionToken;
}

export function getSessionCache() {
  return sessionCache;
}

export function setSessionCache(data: {
  sessionToken: string;
  expiresAt: Date;
  quotaRemaining: number;
  quotaLimit: number;
}): void {
  sessionCache = data;
}

export function clearSessionCache(): void {
  sessionCache = null;
}

export function validateODAIConfig(): void {
  if (process.env.ODAI_ACCESS_TOKEN) {
    return;
  }

  if (!sessionCache) {
    throw new AuthenticationError(
      "No active session. Authentication required.",
      401
    );
  }
}
