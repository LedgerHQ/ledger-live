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

export type FearAndGreedLevel = "fear" | "cautious" | "neutral" | "optimistic" | "greedy";

export enum AltcoinSeasonIndexTags {
  Latest = "AltcoinSeasonIndexLatest",
}

const AltcoinSeasonIndexDataSchema = z.object({
  altcoin_index: z.number().min(0).max(100),
  altcoin_marketcap: z.number(),
  snapshot_time: z.string(),
  yearly_high: z.number(),
  yearly_high_date: z.string(),
  yearly_low: z.number(),
  yearly_low_date: z.string(),
});

const AltcoinSeasonIndexStatusSchema = z.object({
  timestamp: z.string(),
  error_code: z.union([z.number(), z.string()]),
  error_message: z.string().nullable(),
  elapsed: z.number(),
  credit_count: z.number(),
  notice: z.string().nullable(),
});

export const AltcoinSeasonIndexResponseSchema = z.object({
  data: AltcoinSeasonIndexDataSchema,
  status: AltcoinSeasonIndexStatusSchema,
});

export const AltcoinSeasonIndexSchema = z.object({
  altcoinIndex: z.number().min(0).max(100),
  altcoinMarketcap: z.number(),
  snapshotTime: z.string(),
  yearlyHigh: z.number(),
  yearlyHighDate: z.string(),
  yearlyLow: z.number(),
  yearlyLowDate: z.string(),
});

export type AltcoinSeasonIndexResponse = z.infer<typeof AltcoinSeasonIndexResponseSchema>;
export type AltcoinSeasonIndex = z.infer<typeof AltcoinSeasonIndexSchema>;
