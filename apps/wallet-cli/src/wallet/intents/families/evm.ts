import { z } from "zod";
import { AmountWithTickerSchema } from "./bitcoin";

export const EvmTransactionIntentSchema = z.object({
  family: z.literal("evm"),
  recipient: z.string(),
  amount: AmountWithTickerSchema,
  data: z
    .string()
    .regex(/^0x([0-9a-fA-F]{2})*$/, "data must be 0x-prefixed hex with an even number of digits")
    .optional(),
});
