"use client";

import { History } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ODAILogo, PlusIcon } from "./icons";

interface ChatHeaderProps {
  onHistoryClick?: () => void;
}

function PureChatHeader({ onHistoryClick }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
      {}
      <div className="flex items-center gap-3">
        <ODAILogo className="shrink-0" size={72} />
      </div>

      {}
      <div className="ml-auto flex items-center gap-2">
        {onHistoryClick && (
          <Button
            className="h-9 gap-2 rounded-full px-4 text-white hover:opacity-90"
            style={{ background: "#3B43FE" }}
            onClick={onHistoryClick}
            title="View thinking history"
          >
            <History className="h-4 w-4" />
            <span>History</span>
          </Button>
        )}
        <Button
          className="h-9 gap-2 rounded-full px-4 text-white hover:opacity-90"
          style={{ background: "#3B43FE" }}
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
        >
          <PlusIcon />
          <span>New Chat</span>
        </Button>
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
