import { streamObject, tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { myProvider } from "../providers";
import { documentsStore } from "./update-document";

type RequestSuggestionsProps = {
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

type Suggestion = {
  id: string;
  documentId: string;
  originalText: string;
  suggestedText: string;
  description: string;
  isResolved: boolean;
};

export const requestSuggestions = ({ dataStream }: RequestSuggestionsProps) =>
  tool({
    description: "Request suggestions for a document",
    inputSchema: z.object({
      documentId: z
        .string()
        .describe("The ID of the document to request edits"),
    }),
    execute: async ({ documentId }) => {
      const document = documentsStore.get(documentId);

      if (!document || !document.content) {
        return {
          error: "Document not found",
        };
      }

      const suggestions: Suggestion[] = [];

      const { elementStream } = streamObject({
        model: myProvider.languageModel("artifact-model"),
        system:
          "You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.",
        prompt: document.content,
        output: "array",
        schema: z.object({
          originalSentence: z.string().describe("The original sentence"),
          suggestedSentence: z.string().describe("The suggested sentence"),
          description: z.string().describe("The description of the suggestion"),
        }),
      });

      for await (const element of elementStream) {
        const suggestion: Suggestion = {
          originalText: element.originalSentence,
          suggestedText: element.suggestedSentence,
          description: element.description,
          id: generateUUID(),
          documentId,
          isResolved: false,
        };

        dataStream.write({
          type: "data-suggestion",
          data: suggestion,
          transient: true,
        });

        suggestions.push(suggestion);
      }

      return {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: "Suggestions have been added to the document",
      };
    },
  });
