"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";

interface ResponsiveSheetProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function ResponsiveSheet({
  children,
  open,
  onOpenChange,
  title,
  description,
}: ResponsiveSheetProps) {
  const isDesktop = !useMediaQuery("(max-width: 768px)");

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full overflow-y-auto sm:max-w-md"
          side="right"
        >
          {(title || description) && (
            <SheetHeader>
              {title && <SheetTitle className="font-sans">{title}</SheetTitle>}
              {description && <SheetDescription className="font-sans">{description}</SheetDescription>}
            </SheetHeader>
          )}
          <div className="mt-4">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[85vh] flex-col rounded-t-[10px] border bg-background">
          <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
          <div className="flex-1 overflow-y-auto p-4">
            {(title || description) && (
              <div className="mb-4 space-y-2">
                {title && (
                  <h2 className="font-sans text-lg font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="font-sans text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            )}
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

