export type Suggestion = {
  id: string;
  documentId: string;
  originalText: string;
  suggestedText: string;
  description: string;
  isResolved: boolean;
};

export type Vote = {
  chatId: string;
  messageId: string;
  type: "up" | "down";
  isUpvoted: boolean;
  isDownvoted: boolean;
};

export type Document = {
  id: string;
  title: string;
  content: string;
  kind: "text" | "code" | "image" | "sheet";
  createdAt: Date;
};

export type VisibilityType = "public" | "private";

export type DBMessage = {
  id: string;
  chatId: string;
  role: string;
  parts: any[];
  attachments: any[];
  createdAt: Date;
};
