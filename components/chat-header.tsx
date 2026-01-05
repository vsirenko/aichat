"use client";

import { useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ODAILogo, PlusIcon } from "./icons";

function PureChatHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
      {}
      <div className="flex items-center gap-3">
        <ODAILogo className="shrink-0" size={36} />
      </div>

      {}
      <Button
        className="ml-auto h-9 gap-2 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
        onClick={() => {
          router.push("/");
          router.refresh();
        }}
      >
        <PlusIcon />
        <span>New Chat</span>
      </Button>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
