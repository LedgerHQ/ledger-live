import { z } from "zod";

export const CorrectAddressSchema = z.object({
  address: z.string(),
  lastUsed: z.number(),
  ensName: z.string().optional(),
});

export type RecentAddress = z.infer<typeof CorrectAddressSchema>;

export const LegacyStringAddressSchema = z
  .string()
  .transform((address): RecentAddress => ({ address, lastUsed: Date.now(), ensName: undefined }));

/** Recovers entries corrupted by a past migration that nested the address inside itself. */
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

export const RecentAddressSchema = z.union([
  LegacyStringAddressSchema,
  CorrectAddressSchema,
  CorruptedNestedAddressSchema,
]);

/** Parses a persisted list, dropping entries that match none of the supported formats. */
export const RecentAddressesArraySchema = z.array(z.unknown()).transform(entries =>
  entries
    .map(entry => {
      const result = RecentAddressSchema.safeParse(entry);
      return result.success ? result.data : null;
    })
    .filter((entry): entry is RecentAddress => entry !== null && entry.address.length > 0),
);

export const RecentAddressesStateSchema = z.record(z.string(), RecentAddressesArraySchema);

export type RecentAddressesState = z.infer<typeof RecentAddressesStateSchema>;

export const initialRecentAddressesState: RecentAddressesState = {};
