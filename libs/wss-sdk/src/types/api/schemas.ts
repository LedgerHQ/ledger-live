import { z } from "zod";

// COMMON
export const schemaDataType = z.enum([
  "configuration",
  "accounts",
  "addresses",
  "transaction-tags",
]);

// ATOMIC GET
export const schemaAtomicGetNoData = z.object({
  status: z.literal("no-data"),
});
export const schemaAtomicGetUpToDate = z.object({
  status: z.literal("up-to-date"),
});
export const schemaAtomicGetOutOfSync = z.object({
  status: z.literal("out-of-sync"),
  version: z.number(),
  payload: z.string(),
  date: z.string(),
  info: z.string().optional(),
});
export const schemaAtomicGetResponse = z.discriminatedUnion("status", [
  schemaAtomicGetNoData,
  schemaAtomicGetUpToDate,
  schemaAtomicGetOutOfSync,
]);

// ATOMIC POST
export const schemaAtomicPostRequest = z.object({
  payload: z.string(),
});
export const schemaAtomicPostUpdated = z.object({
  status: z.literal("updated"),
  version: z.number(),
});
export const schemaAtomicPostOutOfSync = z.object({
  status: z.literal("out-of-sync"),
  version: z.number(),
  payload: z.string(),
  date: z.string(),
  info: z.string().optional(),
});
export const schemaAtomicPostResponse = z.discriminatedUnion("status", [
  schemaAtomicPostUpdated,
  schemaAtomicPostOutOfSync,
]);

// INCREMENTAL COMMON
export const schemaIncrementalUpdate = z.object({
  version: z.number(),
  payload: z.string(),
  date: z.string(),
  info: z.string().optional(),
});

// INCREMENTAL GET
export const schemaIncrementalGetNoData = z.object({
  status: z.literal("no-data"),
});
export const schemaIncrementalGetUpToDate = z.object({
  status: z.literal("up-to-date"),
});
export const schemaIncrementalGetOutOfSync = z.object({
  status: z.literal("out-of-sync"),
  updates: z.array(schemaIncrementalUpdate),
});
export const schemaIncrementalGetResponse = z.discriminatedUnion("status", [
  schemaIncrementalGetNoData,
  schemaIncrementalGetUpToDate,
  schemaIncrementalGetOutOfSync,
]);

// INCREMENTAL POST
export const schemaIncrementalPostRequest = z.object({
  payload: z.string(),
});
export const schemaIncrementalPostUpdated = z.object({
  status: z.literal("updated"),
  version: z.number(),
});
export const schemaIncrementalPostOutOfSync = z.object({
  status: z.literal("out-of-sync"),
  updates: z.array(schemaIncrementalUpdate),
});
export const schemaIncrementalPostResponse = z.discriminatedUnion("status", [
  schemaIncrementalPostUpdated,
  schemaIncrementalPostOutOfSync,
]);
