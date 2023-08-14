import { z } from "zod";
import {
  schemaAtomicGetNoData,
  schemaAtomicGetOutOfSync,
  schemaAtomicGetResponse,
  schemaAtomicGetUpToDate,
  schemaAtomicPostOutOfSync,
  schemaAtomicPostRequest,
  schemaAtomicPostResponse,
  schemaAtomicPostUpdated,
  schemaIncrementalGetNoData,
  schemaIncrementalGetOutOfSync,
  schemaIncrementalGetResponse,
  schemaIncrementalGetUpToDate,
  schemaIncrementalUpdate,
  schemaIncrementalPostRequest,
  schemaIncrementalPostUpdated,
  schemaIncrementalPostOutOfSync,
  schemaIncrementalPostResponse,
  schemaDataType,
} from "./schemas";

// COMMON
export type DataType = z.infer<typeof schemaDataType>;

// ATOMIC GET
export type AtomicGetNoData = z.infer<typeof schemaAtomicGetNoData>;
export type AtomicGetUpToDate = z.infer<typeof schemaAtomicGetUpToDate>;
export type AtomicGetOutOfSync = z.infer<typeof schemaAtomicGetOutOfSync>;
export type AtomicGetResponse = z.infer<typeof schemaAtomicGetResponse>;

// ATOMIC POST
export type AtomicPostRequest = z.infer<typeof schemaAtomicPostRequest>;
export type AtomicPostUpdated = z.infer<typeof schemaAtomicPostUpdated>;
export type AtomicPostOutOfSync = z.infer<typeof schemaAtomicPostOutOfSync>;
export type AtomicPostResponse = z.infer<typeof schemaAtomicPostResponse>;

// INCREMENTAL COMMON
export type IncrementalUpdate = z.infer<typeof schemaIncrementalUpdate>;

// INCREMENTAL GET
export type IncrementalGetNoData = z.infer<typeof schemaIncrementalGetNoData>;
export type IncrementalGetUpToDate = z.infer<typeof schemaIncrementalGetUpToDate>;
export type IncrementalGetOutOfSync = z.infer<typeof schemaIncrementalGetOutOfSync>;
export type IncrementalGetResponse = z.infer<typeof schemaIncrementalGetResponse>;

// INCREMENTAL POST
export type IncrementalPostRequest = z.infer<typeof schemaIncrementalPostRequest>;
export type IncrementalPostUpdated = z.infer<typeof schemaIncrementalPostUpdated>;
export type IncrementalPostOutOfSync = z.infer<typeof schemaIncrementalPostOutOfSync>;
export type IncrementalPostResponse = z.infer<typeof schemaIncrementalPostResponse>;
