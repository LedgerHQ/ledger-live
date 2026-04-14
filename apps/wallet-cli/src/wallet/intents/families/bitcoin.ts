import { z } from "zod";

const isAmountWithTicker = (s: string) => {
  const t = s.trim();
  return (
    /^\d+(?:\.\d+)?\s*[A-Za-z][A-Za-z0-9._-]*$/.test(t) ||
    /^[A-Za-z][A-Za-z0-9._-]*\s*\d+(?:\.\d+)?$/.test(t)
  );
};

export const AmountWithTickerSchema = z
  .string()
  .refine(isAmountWithTicker, "Amount must include a ticker, e.g. '0.5 ETH' or '0.001 BTC'");

export const BitcoinTransactionIntentSchema = z.object({
  family: z.literal("bitcoin"),
  recipient: z.string(),
  amount: AmountWithTickerSchema,
  feePerByte: z.string().optional(),
  rbf: z.boolean().optional(),
});
