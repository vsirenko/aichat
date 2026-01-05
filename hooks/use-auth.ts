"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearSession,
  getSession,
  isSessionValid,
  saveSession,
} from "@/lib/session-manager";
import type { SessionTokenResponse } from "@/lib/ai/odai-types";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{
    quotaRemaining: number;
    quotaLimit: number;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const valid = isSessionValid();
      setIsAuthenticated(valid);

      if (valid) {
        const session = getSession();
        if (session) {
          setSessionInfo({
            quotaRemaining: session.quotaRemaining,
            quotaLimit: session.quotaLimit,
            expiresAt: session.expiresAt,
          });
        }
      } else {
        setSessionInfo(null);
      }
    };

    checkAuth();

    const interval = setInterval(checkAuth, 30000);

    return () => clearInterval(interval);
  }, []);

  const authenticate = useCallback((data: SessionTokenResponse) => {
    saveSession(data);
    setIsAuthenticated(true);
    setSessionInfo({
      quotaRemaining: data.quota_remaining,
      quotaLimit: data.quota_limit,
      expiresAt: data.expires_at,
    });
  }, []);

  const logout = useCallback(async () => {
    const session = getSession();
    if (session) {
      try {
        await fetch("/api/auth/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_token: session.sessionToken }),
        });
      } catch (error) {
        console.error("Failed to revoke token:", error);
      }
    }

    clearSession();
    setIsAuthenticated(false);
    setSessionInfo(null);
  }, []);

  const promptForAccessCode = useCallback(() => {
    setShowAccessCodeModal(true);
  }, []);

  const handleAccessCodeSuccess = useCallback(() => {
    const session = getSession();
    if (session) {
      setIsAuthenticated(true);
      setSessionInfo({
        quotaRemaining: session.quotaRemaining,
        quotaLimit: session.quotaLimit,
        expiresAt: session.expiresAt,
      });
    }
  }, []);

  return {
    isAuthenticated,
    sessionInfo,
    authenticate,
    logout,
    promptForAccessCode,
    showAccessCodeModal,
    setShowAccessCodeModal,
    handleAccessCodeSuccess,
  };
}

