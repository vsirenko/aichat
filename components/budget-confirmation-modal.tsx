"use client";

import { AlertTriangleIcon, ClockIcon } from "lucide-react";
import { memo, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { BudgetConfirmationRequiredEvent } from "@/lib/ai/odai-types";

interface BudgetConfirmationModalProps {
  event: BudgetConfirmationRequiredEvent;
  onConfirm: (action: "continue" | "reduce" | "abort") => void;
  onClose: () => void;
}

function PureBudgetConfirmationModal({
  event,
  onConfirm,
  onClose,
}: BudgetConfirmationModalProps) {
  const [timeLeft, setTimeLeft] = useState(event.timeout_seconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirm("continue");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onConfirm]);

  return (
    <AlertDialog onOpenChange={(open) => !open && onClose()} open>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/30">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <AlertDialogTitle className="text-xl">
              High Cost Estimate
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            {event.message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <div className="text-center">
            <div className="mb-1 font-medium text-muted-foreground text-sm">
              Estimated Cost
            </div>
            <div className="font-bold text-5xl tracking-tight">
              ${event.estimated_cost_usd.toFixed(2)}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 px-6 py-4">
            <ClockIcon className="h-5 w-5 text-muted-foreground" />
            <div className="font-bold text-3xl tabular-nums">{timeLeft}s</div>
            <div className="text-muted-foreground text-xs">
              {timeLeft > 0 ? "Auto-continuing..." : "Processing..."}
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {event.options.map((option) => {
            if (option.action === "continue") {
              return (
                <AlertDialogAction
                  className="w-full font-semibold text-base"
                  key={option.action}
                  onClick={() => {
                    onConfirm(option.action);
                    onClose();
                  }}
                >
                  {option.label}
                  {option.new_estimated_cost_usd !== undefined && (
                    <span className="ml-2 font-normal opacity-80">
                      ${option.new_estimated_cost_usd.toFixed(2)}
                    </span>
                  )}
                </AlertDialogAction>
              );
            }

            if (option.action === "reduce") {
              return (
                <Button
                  className="w-full font-semibold text-base"
                  key={option.action}
                  onClick={() => {
                    onConfirm(option.action);
                    onClose();
                  }}
                  variant="outline"
                >
                  {option.label}
                  {option.new_estimated_cost_usd !== undefined && (
                    <span className="ml-2 font-normal opacity-80">
                      ${option.new_estimated_cost_usd.toFixed(2)}
                    </span>
                  )}
                </Button>
              );
            }

            if (option.action === "abort") {
              return (
                <AlertDialogCancel
                  className="w-full text-base"
                  key={option.action}
                  onClick={() => {
                    onConfirm(option.action);
                    onClose();
                  }}
                >
                  {option.label}
                </AlertDialogCancel>
              );
            }

            return null;
          })}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const BudgetConfirmationModal = memo(PureBudgetConfirmationModal);
