import { z } from "zod";

// Value objects — owned here until @domain/entity-market is created (Phase 2),
// at which point CurrencyId and Timestamp will be imported from there.
export const CurrencyIdSchema = z.string().min(1).brand<"CurrencyId">();
export type CurrencyId = z.infer<typeof CurrencyIdSchema>;

export const TimestampSchema = z.number().int().min(0).brand<"Timestamp">();
export type Timestamp = z.infer<typeof TimestampSchema>;

export const CryptoAssetStateSchema = z.object({
  supportedCurrencyIds: z.array(CurrencyIdSchema),
  lastSync: TimestampSchema.nullable(),
});

export type CryptoAssetState = z.infer<typeof CryptoAssetStateSchema>;
