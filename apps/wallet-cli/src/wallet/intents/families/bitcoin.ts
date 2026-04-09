import { z } from "zod";

export const AmountWithTickerSchema = z
  .string()
  .regex(
    /^\s*(?:[A-Za-z]+\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*[A-Za-z]+)\s*$/,
    "Amount must include a ticker, e.g. '0.5 ETH' or '0.001 BTC'",
  );

export const BitcoinTransactionIntentSchema = z.object({
  family: z.literal("bitcoin"),
  recipient: z.string(),
  amount: AmountWithTickerSchema,
  feePerByte: z.string().optional(),
  rbf: z.boolean().optional(),
});
