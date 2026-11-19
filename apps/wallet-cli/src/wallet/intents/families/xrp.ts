import { z } from "zod";
import { AmountWithTickerSchema } from "./bitcoin";

/** Native XRP payment. Destination tags are unsigned 32-bit integers on XRPL. */
export const XrpTransactionIntentSchema = z.object({
  family: z.literal("xrp"),
  recipient: z
    .string()
    .regex(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, "Recipient must be a valid XRP classic address"),
  amount: AmountWithTickerSchema,
  destinationTag: z.number().int().min(0).max(4_294_967_295).optional(),
});
