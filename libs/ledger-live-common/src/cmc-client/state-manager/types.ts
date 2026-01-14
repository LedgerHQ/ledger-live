import { z } from "zod";

export enum FearAndGreedTags {
  Latest = "FearAndGreedLatest",
}

const FearAndGreedDataSchema = z.object({
  value: z.number().min(0).max(100),
  value_classification: z.string(),
  update_time: z.string(),
});

const FearAndGreedStatusSchema = z.object({
  timestamp: z.string(),
  error_code: z.union([z.number(), z.string()]),
  error_message: z.string(),
  elapsed: z.number(),
  credit_count: z.number(),
  notice: z.string().optional(),
});

export const FearAndGreedResponseSchema = z.object({
  data: FearAndGreedDataSchema,
  status: FearAndGreedStatusSchema,
});

export const FearAndGreedIndexSchema = z.object({
  value: z.number().min(0).max(100),
  classification: z.string(),
});

export type FearAndGreedData = z.infer<typeof FearAndGreedDataSchema>;
export type FearAndGreedStatus = z.infer<typeof FearAndGreedStatusSchema>;
export type FearAndGreedResponse = z.infer<typeof FearAndGreedResponseSchema>;
export type FearAndGreedIndex = z.infer<typeof FearAndGreedIndexSchema>;
