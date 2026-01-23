"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessCodeModal } from "@/components/access-code-modal";
import { ChatHeader } from "@/components/chat-header";
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
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAuth } from "@/hooks/use-auth";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useHistory } from "@/hooks/use-history";
import { ChatSDKError } from "@/lib/errors";
import { getSession } from "@/lib/session-manager";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { BudgetConfirmationModal } from "./budget-confirmation-modal";
import { useDataStream } from "./data-stream-provider";
import { HistoryDrawer } from "./history-drawer";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { ODAIContextProvider, useODAIContext } from "./odai-context";
import { PhaseProgressPanel } from "./phase-progress-panel";
import { ThinkingIndicator } from "./thinking-indicator";
import { toast } from "./toast";

function ChatInner({
  id,
  initialMessages,
  initialChatModel,
  isReadonly,
  autoResume,
  initialLastContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: string;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const router = useRouter();
  const odaiContext = useODAIContext();
  const auth = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const { history, addHistoryEntry, clearHistory, removeEntry } = useHistory();
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [lastUserQuery, setLastUserQuery] = useState<string>("");
  const hasCompletedPhasesRef = useRef(false);

  useEffect(() => {
    if (!authChecked) {
      setAuthChecked(true);
      return;
    }

    if (!auth.isAuthenticated && !process.env.NEXT_PUBLIC_SKIP_AUTH) {
      auth.promptForAccessCode();
    }
  }, [auth.isAuthenticated, authChecked]);

  useEffect(() => {
    const handlePopState = () => {
      router.refresh();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  const [odaiParams, setOdaiParams] = useState({
    includePhaseEvents: true,
    skipSafetyCheck: false,
    skipLlmEnhancement: false,
    skipLlmJudge: false,
    useOssOnly: false,
    maxSamplesPerModel: 3,
  });
  const odaiParamsRef = useRef(odaiParams);

  const handleParametersChange = useCallback(
    (params: {
      includePhaseEvents?: boolean;
      skipSafetyCheck?: boolean;
      skipLlmEnhancement?: boolean;
      skipLlmJudge?: boolean;
      useOssOnly?: boolean;
      maxSamplesPerModel?: number;
    }) => {
      setOdaiParams((prev) => ({ ...prev, ...params }));
    },
    []
  );

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  useEffect(() => {
    odaiParamsRef.current = odaiParams;
  }, [odaiParams]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      body: () => {
        const requestBody = {
          id,
          selectedChatModel: currentModelIdRef.current,
          include_phase_events: odaiParamsRef.current.includePhaseEvents,
          skip_safety_check: odaiParamsRef.current.skipSafetyCheck,
          skip_llm_enhancement: odaiParamsRef.current.skipLlmEnhancement,
          skip_llm_judge: odaiParamsRef.current.skipLlmJudge,
          use_oss_only: odaiParamsRef.current.useOssOnly,
          max_samples_per_model: odaiParamsRef.current.maxSamplesPerModel,
        };
        console.log("[Chat] Sending chat request with sessionId:", id);
        console.log("[Chat] Full request body:", requestBody);
        return requestBody;
      },
      headers: () => {
        const session = getSession();
        const headers: Record<string, string> = {};
        if (session) {
          headers.Authorization = `Bearer ${session.sessionToken}`;
          console.log("[Chat] Authorization header added");
        } else {
          console.log("[Chat] No session found, sending without auth");
        }
        return headers;
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));

      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);

      if (error instanceof ChatSDKError) {
        if (error.type === "unauthorized" && error.surface === "auth") {
          auth.promptForAccessCode();
        } else if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      } else {
        toast({
          type: "error",
          description:
            error?.message || "Failed to generate response. Please try again.",
        });
      }
    },
  });

  useEffect(() => {
    console.log(`[Chat] Status changed to: ${status}`);
    if (status === "submitted") {
      console.log("[Chat] Resetting ODAI context");
      odaiContext.reset();
      hasCompletedPhasesRef.current = false;
    }
  }, [status, odaiContext.reset]);

  // Separate effect for saving to history
  useEffect(() => {
    if (status === "ready" && !hasCompletedPhasesRef.current && odaiContext.phases.some(p => p.status === "completed")) {
      console.log("[Chat] Saving completed phases to history");
      hasCompletedPhasesRef.current = true;
      addHistoryEntry({
        phases: [...odaiContext.phases],
        models: [...odaiContext.models],
        webSources: [...odaiContext.webSources],
        webRefreshDetails: odaiContext.webRefreshDetails,
        userQuery: lastUserQuery,
      });
    }
  }, [status]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef({
    handlePhaseStart: odaiContext.handlePhaseStart,
    handlePhaseProgress: odaiContext.handlePhaseProgress,
    handlePhaseComplete: odaiContext.handlePhaseComplete,
    handleModelActive: odaiContext.handleModelActive,
    handleModelComplete: odaiContext.handleModelComplete,
    handleWebSearch: odaiContext.handleWebSearch,
    handleWebScrape: odaiContext.handleWebScrape,
    setCostEstimate: odaiContext.setCostEstimate,
    setCostSummary: odaiContext.setCostSummary,
    setBudgetConfirmation: odaiContext.setBudgetConfirmation,
    addErrorEvent: odaiContext.addErrorEvent,
  });

  useEffect(() => {
    handlersRef.current = {
      handlePhaseStart: odaiContext.handlePhaseStart,
      handlePhaseProgress: odaiContext.handlePhaseProgress,
      handlePhaseComplete: odaiContext.handlePhaseComplete,
      handleModelActive: odaiContext.handleModelActive,
      handleModelComplete: odaiContext.handleModelComplete,
      handleWebSearch: odaiContext.handleWebSearch,
      handleWebScrape: odaiContext.handleWebScrape,
      setCostEstimate: odaiContext.setCostEstimate,
      setCostSummary: odaiContext.setCostSummary,
      setBudgetConfirmation: odaiContext.setBudgetConfirmation,
      addErrorEvent: odaiContext.addErrorEvent,
    };
  }, [odaiContext]);

  // Open EventSource connection immediately on mount and keep it open
  useEffect(() => {
    if (!eventSourceRef.current) {
      console.log("[ODAI SSE] Opening persistent EventSource connection");
      console.log("[ODAI SSE] Chat ID (sessionId):", id);
      console.log("[ODAI SSE] EventSource URL:", `/api/chat/events?sessionId=${id}`);
      const eventSource = new EventSource(`/api/chat/events?sessionId=${id}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("[ODAI SSE] Connection opened successfully");
      };

      eventSource.onmessage = (event) => {
        try {
          console.log("[ODAI SSE] Raw event data:", event.data);
          const data = JSON.parse(event.data);
          console.log("[ODAI SSE] Parsed event:", data);

          if (data.type === "connected") {
            console.log("[ODAI SSE] Connected event received");
            return;
          }

          const { eventType, data: eventData } = data;
          
          if (!eventType) {
            console.warn("[ODAI SSE] Event without eventType:", data);
            return;
          }
          
          if (!eventData) {
            console.warn("[ODAI SSE] Event without data:", data);
            return;
          }
          
          console.log(`[ODAI SSE] Processing ${eventType}:`, eventData);
          
          // DEBUG: Log if this is a cost-related event
          if (eventType.includes("cost")) {
            console.log(`[ODAI SSE] 🔥 COST EVENT DETECTED: ${eventType}`, eventData);
          }

          switch (eventType) {
            case "phase.start":
              console.log(`[ODAI SSE] Phase START: ${eventData.phase} (${eventData.phase_name})`);
              handlersRef.current.handlePhaseStart(eventData);
              break;
            case "phase.progress":
              console.log(`[ODAI SSE] Phase PROGRESS: ${eventData.phase} - ${eventData.step_name} (${eventData.progress_percent}%)`);
              handlersRef.current.handlePhaseProgress(eventData);
              break;
            case "phase.complete":
              console.log(`[ODAI SSE] Phase COMPLETE: ${eventData.phase} - Duration: ${(eventData.duration_ms / 1000).toFixed(2)}s, Success: ${eventData.success}`);
              handlersRef.current.handlePhaseComplete(eventData);
              break;
            case "model.active":
              console.log(`[ODAI SSE] Model ACTIVE: ${eventData.model_id} (${eventData.provider}) - Sample ${eventData.sample_index}`);
              handlersRef.current.handleModelActive(eventData);
              break;
            case "model.complete":
              console.log(`[ODAI SSE] Model COMPLETE: ${eventData.model_id} - Status: ${eventData.status}, Duration: ${(eventData.duration_ms / 1000).toFixed(2)}s`);
              handlersRef.current.handleModelComplete(eventData);
              break;
            case "web.search":
              console.log(`[ODAI SSE] Web Search: ${eventData.action}`, eventData.sources_count ? `${eventData.sources_count} sources` : "");
              handlersRef.current.handleWebSearch(eventData);
              break;
            case "web.scrape":
              console.log(`[ODAI SSE] Web Scrape: ${eventData.action}`, eventData.urls_scraped ? `${eventData.urls_scraped.length} URLs` : "");
              handlersRef.current.handleWebScrape(eventData);
              break;
            case "cost.estimate":
              console.log(`[ODAI SSE] Cost Estimate: $${eventData.estimated_cost_usd.toFixed(4)} - ${eventData.sample_count} samples`);
              handlersRef.current.setCostEstimate(eventData);
              break;
            case "cost.summary":
              console.log(`[ODAI SSE] Cost Summary received:`, eventData);
              console.log(`[ODAI SSE] Setting cost summary: $${eventData.total_cost_usd.toFixed(6)} - ${eventData.total_tokens} tokens`);
              handlersRef.current.setCostSummary(eventData);
              console.log(`[ODAI SSE] Cost summary set successfully`);
              break;
            case "budget.confirmation_required":
              console.log(`[ODAI SSE] Budget Confirmation Required: $${eventData.estimated_cost_usd}`);
              handlersRef.current.setBudgetConfirmation(eventData);
              break;
            case "error":
              console.log(`[ODAI SSE] Error: ${eventData.type} - ${eventData.message}`);
              handlersRef.current.addErrorEvent(eventData);
              if (!eventData.recoverable) {
                toast({
                  type: "error",
                  description: `Pipeline Error: ${eventData.message}`
                });
              }
              break;
            default:
              console.log(`[ODAI SSE] Unknown event type: ${eventType}`, eventData);
              break;
          }
        } catch (error) {
          console.error("[ODAI SSE] Failed to parse event:", error);
          console.error("[ODAI SSE] Raw data:", event.data);
          console.error("[ODAI SSE] Error stack:", error instanceof Error ? error.stack : "No stack");
        }
      };

      eventSource.onerror = (error) => {
        console.error("[ODAI SSE] Connection error:", error);
        console.log("[ODAI SSE] ReadyState:", eventSource.readyState);
        console.log("[ODAI SSE] ReadyState meanings: 0=CONNECTING, 1=OPEN, 2=CLOSED");
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log("[ODAI SSE] Connection closed, attempting reconnect...");
          eventSourceRef.current = null;
          // Reconnect after a short delay
          setTimeout(() => {
            if (!eventSourceRef.current) {
              console.log("[ODAI SSE] Reconnecting...");
              window.location.reload(); // Simple reconnect by reloading
            }
          }, 1000);
        }
      };
    }

    return () => {
      if (eventSourceRef.current) {
        console.log("[ODAI SSE] Component unmounting or id changed, closing EventSource");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [id]); // Reconnect when chat id changes

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      setLastUserQuery(query);
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col overflow-visible bg-background">
        <ChatHeader onHistoryClick={() => setShowHistoryDrawer(true)} />

        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={currentModelId}
          setMessages={setMessages}
          status={status}
          votes={[]}
        />

        {!isReadonly &&
          (status === "streaming" ||
            status === "submitted" ||
            odaiContext.phases.some((p) => p.status !== "pending")) && (
            <div className="sticky bottom-0 z-2 w-full animate-fade-in space-y-4 overflow-visible bg-background px-4 py-6">
              {(status === "streaming" || status === "submitted") && (
                <ThinkingIndicator className="mx-auto max-w-md" />
              )}
              <PhaseProgressPanel />
            </div>
          )}

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl flex-col gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              includePhaseEvents={odaiParams.includePhaseEvents}
              input={input}
              maxSamplesPerModel={odaiParams.maxSamplesPerModel}
              messages={messages}
              onModelChange={setCurrentModelId}
              onParametersChange={handleParametersChange}
              onQuerySubmit={setLastUserQuery}
              selectedModelId={currentModelId}
              selectedVisibilityType="private"
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              skipLlmEnhancement={odaiParams.skipLlmEnhancement}
              skipLlmJudge={odaiParams.skipLlmJudge}
              skipSafetyCheck={odaiParams.skipSafetyCheck}
              useOssOnly={odaiParams.useOssOnly}
              status={status}
              stop={stop}
              usage={usage}
            />
          )}
        </div>
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType="private"
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={[]}
      />

      {odaiContext.budgetConfirmation && (
        <BudgetConfirmationModal
          event={odaiContext.budgetConfirmation}
          onClose={() => odaiContext.setBudgetConfirmation(null)}
          onConfirm={() => {
            odaiContext.setBudgetConfirmation(null);
          }}
        />
      )}

      <AccessCodeModal
        onOpenChange={auth.setShowAccessCodeModal}
        onSuccess={auth.handleAccessCodeSuccess}
        open={auth.showAccessCodeModal}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HistoryDrawer
        history={history}
        onClearHistory={clearHistory}
        onOpenChange={setShowHistoryDrawer}
        onRemoveEntry={removeEntry}
        open={showHistoryDrawer}
      />
    </>
  );
}

export function Chat(props: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: string;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  return (
    <ODAIContextProvider>
      <ChatInner {...props} />
    </ODAIContextProvider>
  );
}
