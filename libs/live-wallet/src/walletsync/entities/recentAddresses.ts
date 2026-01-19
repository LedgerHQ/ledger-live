import { z } from "zod";

/**
 * Zod schema for correct distant address format (WalletSync)
 * Includes index field for maintaining order across sync
 */
export const CorrectDistantAddressSchema = z.object({
  address: z.string(),
  index: z.number(),
  lastUsed: z.number().optional(),
});

/**
 * Zod schema for corrupted nested address format in WalletSync
 * Handles data corruption where address is an object instead of a string
 * Expected format: { address: { address: string, lastUsed?: number, ensName?: string }, index: number, lastUsed?: number }
 */
export const CorruptedNestedDistantAddressSchema = z
  .object({
    address: z.object({
      address: z.string(),
      lastUsed: z.number().optional(),
      ensName: z.string().optional(),
    }),
    index: z.number(),
    lastUsed: z.number().optional(),
  })
  .transform(entry => ({
    address: entry.address.address,
    index: entry.index,
    lastUsed: entry.address.lastUsed ?? entry.lastUsed,
  }));

/**
 * Union schema for all distant address formats
 * Supports: correct format and corrupted nested format
 */
export const RecentAddressSchema = z.union([
  CorrectDistantAddressSchema,
  CorruptedNestedDistantAddressSchema,
]);

/**
 * Schema for WalletSync recent addresses with sanitization
 * Filters out invalid entries while preserving valid addresses
 */
export const schema = z.record(
  z.string(),
  z.array(z.unknown()).transform(entries => {
    return entries
      .map(entry => {
        const result = RecentAddressSchema.safeParse(entry);
        return result.success ? result.data : null;
      })
      .filter((entry): entry is z.infer<typeof CorrectDistantAddressSchema> => entry !== null);
  }),
);
