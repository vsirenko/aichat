"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { saveSession } from "@/lib/session-manager";
import type { SessionTokenResponse } from "@/lib/ai/odai-types";

interface AccessCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AccessCodeModal({
  open,
  onOpenChange,
  onSuccess,
}: AccessCodeModalProps) {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_code: accessCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Authentication failed");
      }

      const data: SessionTokenResponse = await response.json();

      saveSession(data);

      setAccessCode("");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Enter Access Code</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Please enter your ODAI access code to continue. Your session will
              be valid for 60 minutes with up to 50 requests.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 space-y-2">
            <Label className="font-sans" htmlFor="access-code">Access Code</Label>
            <Input
              autoComplete="off"
              className="font-sans"
              disabled={isLoading}
              id="access-code"
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="DEMO2025"
              required
              type="text"
              value={accessCode}
            />
            {error && <p className="text-sm text-red-500 font-sans">{error}</p>}
          </div>

          <AlertDialogFooter>
            <Button
              className="font-sans"
              disabled={isLoading || !accessCode.trim()}
              type="submit"
              variant="default"
            >
              {isLoading ? "Authenticating..." : "Continue"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

