export const DEFAULT_CHAT_MODEL: string = "odai-frontier";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "odai-frontier",
    name: "ODAI Frontier",
    description: "Full multi-model reasoning pipeline for complex queries",
  },
  {
    id: "odai-fast",
    name: "ODAI Fast",
    description: "Optimized for speed with reduced reasoning depth",
  },
];
