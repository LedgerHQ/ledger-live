import { z } from "zod";
import { AmountWithTickerSchema } from "./bitcoin";

export const EvmTransactionIntentSchema = z.object({
  family: z.literal("evm"),
  recipient: z.string(),
  amount: AmountWithTickerSchema,
});
