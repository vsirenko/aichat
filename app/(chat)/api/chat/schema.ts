import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.enum(["image/jpeg", "image/png"]),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const _partSchema = z.union([textPartSchema, filePartSchema]);

export const postRequestBodySchema = z.object({
  id: z.string().uuid().optional(),
  messages: z.array(z.any()),
  selectedChatModel: z.enum(["odai-frontier", "odai-fast"]),
  include_phase_events: z.boolean().optional().default(true),
  skip_safety_check: z.boolean().optional().default(false),
  skip_llm_enhancement: z.boolean().optional().default(false),
  skip_llm_judge: z.boolean().optional().default(false),
  max_samples_per_model: z.number().min(1).max(10).optional().default(3),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
