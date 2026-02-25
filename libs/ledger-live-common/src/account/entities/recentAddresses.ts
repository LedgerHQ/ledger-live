import { z } from "zod";
import type { RecentAddress } from "@ledgerhq/types-live";

/**
 * Zod schema for legacy string address format (backward compatibility)
 * Migrates old string-only addresses to the new format with metadata
 */
export const LegacyStringAddressSchema = z.string().transform(
  (address): RecentAddress => ({
    address,
    lastUsed: Date.now(),
    ensName: undefined,
  }),
);

/**
 * Zod schema for correct recent address format
 */
export const CorrectAddressSchema = z.object({
  address: z.string(),
  lastUsed: z.number(),
  ensName: z.string().optional(),
});

/**
 * Zod schema for corrupted nested address format
 * Handles data corruption from previous migration issues
 * Expected corrupted format: { address: { address: string, lastUsed?: number, ensName?: string }, index?: number }
 */
export const CorruptedNestedAddressSchema = z
  .object({
    address: z.object({
      address: z.string(),
      lastUsed: z.number().optional(),
      ensName: z.string().optional(),
    }),
    index: z.number().optional(),
  })
  .transform(
    (entry): RecentAddress => ({
      address: entry.address.address,
      lastUsed: entry.address.lastUsed ?? Date.now(),
      ensName: entry.address.ensName,
    }),
  );

/**
 * Union schema for all recent address formats
 * Supports: legacy strings, correct format, and corrupted nested format
 */
export const RecentAddressSchema = z.union([
  LegacyStringAddressSchema,
  CorrectAddressSchema,
  CorruptedNestedAddressSchema,
]);

/**
 * Schema for array of recent addresses with sanitization
 * Filters out invalid entries while preserving valid addresses
 */
export const RecentAddressesArraySchema = z.array(z.unknown()).transform(entries => {
  return entries
    .map(entry => {
      const result = RecentAddressSchema.safeParse(entry);
      return result.success ? result.data : null;
    })
    .filter((entry): entry is RecentAddress => entry !== null && entry.address.length > 0);
});
