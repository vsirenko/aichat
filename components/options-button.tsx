"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SettingsIcon } from "./icons";

export interface OptionsButtonProps {
  includePhaseEvents: boolean;
  skipSafetyCheck: boolean;
  skipLlmEnhancement: boolean;
  skipLlmJudge: boolean;
  useOssOnly: boolean;
  maxSamplesPerModel: number;
  onParametersChange: (params: {
    includePhaseEvents?: boolean;
    skipSafetyCheck?: boolean;
    skipLlmEnhancement?: boolean;
    skipLlmJudge?: boolean;
    useOssOnly?: boolean;
    maxSamplesPerModel?: number;
  }) => void;
}

export function OptionsButton({
  includePhaseEvents,
  skipSafetyCheck,
  skipLlmEnhancement,
  skipLlmJudge,
  useOssOnly,
  maxSamplesPerModel,
  onParametersChange,
}: OptionsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (params: {
    includePhaseEvents?: boolean;
    skipSafetyCheck?: boolean;
    skipLlmEnhancement?: boolean;
    skipLlmJudge?: boolean;
    useOssOnly?: boolean;
    maxSamplesPerModel?: number;
  }) => {
    onParametersChange(params);
  };

  // Auto-enable useOssOnly when skipSafetyCheck is enabled
  useEffect(() => {
    if (skipSafetyCheck && !useOssOnly) {
      handleChange({ useOssOnly: true });
    }
  }, [skipSafetyCheck]);

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          className="h-8 gap-1.5 px-2.5 text-xs"
          type="button"
          variant="outline"
        >
          <SettingsIcon size={14} />
          <span>Options</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80" side="top">
        <div className="space-y-4">
          <div className="font-semibold text-sm">Pipeline Options</div>

          <TooltipProvider>
            <div className="space-y-3">
              {}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={includePhaseEvents}
                      id="include-phase-events"
                      onCheckedChange={(checked) =>
                        handleChange({ includePhaseEvents: checked === true })
                      }
                    />
                    <Label
                      className="cursor-pointer font-normal text-sm"
                      htmlFor="include-phase-events"
                    >
                      Show Progress
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Display live pipeline stages</p>
                </TooltipContent>
              </Tooltip>

              {}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={skipSafetyCheck}
                      id="skip-safety-check"
                      onCheckedChange={(checked) =>
                        handleChange({ skipSafetyCheck: checked === true })
                      }
                    />
                    <Label
                      className="cursor-pointer font-normal text-sm"
                      htmlFor="skip-safety-check"
                    >
                      Bypass Safety
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Skip content safety filter</p>
                </TooltipContent>
              </Tooltip>

              {}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={skipLlmEnhancement}
                      id="skip-llm-enhancement"
                      onCheckedChange={(checked) =>
                        handleChange({ skipLlmEnhancement: checked === true })
                      }
                    />
                    <Label
                      className="cursor-pointer font-normal text-sm"
                      htmlFor="skip-llm-enhancement"
                    >
                      Bypass Enhancement
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Skip AI prompt optimization</p>
                </TooltipContent>
              </Tooltip>

              {}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={skipLlmJudge}
                      id="skip-llm-judge"
                      onCheckedChange={(checked) =>
                        handleChange({ skipLlmJudge: checked === true })
                      }
                    />
                    <Label
                      className="cursor-pointer font-normal text-sm"
                      htmlFor="skip-llm-judge"
                    >
                      Bypass Ranking
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Skip AI response ranking</p>
                </TooltipContent>
              </Tooltip>

              {}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={useOssOnly}
                      disabled={skipSafetyCheck}
                      id="use-oss-only"
                      onCheckedChange={(checked) =>
                        handleChange({ useOssOnly: checked === true })
                      }
                    />
                    <Label
                      className={`cursor-pointer font-normal text-sm ${skipSafetyCheck ? "opacity-50" : ""}`}
                      htmlFor="use-oss-only"
                    >
                      Open Source Only
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use only OSS models</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {}
            <div className="space-y-2 border-t pt-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label className="font-normal text-sm" htmlFor="max-samples">
                    Samples per Model:{" "}
                    <span className="font-semibold">{maxSamplesPerModel}</span>
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>1-10</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center gap-3">
                <input
                  className="flex-1"
                  id="max-samples"
                  max={10}
                  min={1}
                  onChange={(e) =>
                    handleChange({
                      maxSamplesPerModel: Number.parseInt(e.target.value, 10),
                    })
                  }
                  type="range"
                  value={maxSamplesPerModel}
                />
                <span className="text-muted-foreground text-xs">(1-10)</span>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </PopoverContent>
    </Popover>
  );
}
