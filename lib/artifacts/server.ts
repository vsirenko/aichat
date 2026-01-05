import type { UIMessageStreamWriter } from "ai";
import { codeDocumentHandler } from "@/artifacts/code/server";
import { sheetDocumentHandler } from "@/artifacts/sheet/server";
import { textDocumentHandler } from "@/artifacts/text/server";
import type { ArtifactKind } from "@/components/artifact";
import { documentsStore } from "../ai/tools/update-document";
import type { ChatMessage } from "../types";

export type SaveDocumentProps = {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
};

export type CreateDocumentCallbackProps = {
  id: string;
  title: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export type UpdateDocumentCallbackProps = {
  document: { id: string; title: string; kind: string; content: string };
  description: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export type DocumentHandler<T = ArtifactKind> = {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
};

export function createDocumentHandler<T extends ArtifactKind>(config: {
  kind: T;
  onCreateDocument: (params: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (params: UpdateDocumentCallbackProps) => Promise<string>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      const draftContent = await config.onCreateDocument({
        id: args.id,
        title: args.title,
        dataStream: args.dataStream,
      });

      documentsStore.set(args.id, {
        id: args.id,
        title: args.title,
        content: draftContent,
        kind: config.kind,
      });

      return;
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      const draftContent = await config.onUpdateDocument({
        document: args.document,
        description: args.description,
        dataStream: args.dataStream,
      });

      documentsStore.set(args.document.id, {
        id: args.document.id,
        title: args.document.title,
        content: draftContent,
        kind: config.kind,
      });

      return;
    },
  };
}

export const documentHandlersByArtifactKind: DocumentHandler[] = [
  textDocumentHandler,
  codeDocumentHandler,
  sheetDocumentHandler,
];

export const artifactKinds = ["text", "code", "sheet"] as const;
