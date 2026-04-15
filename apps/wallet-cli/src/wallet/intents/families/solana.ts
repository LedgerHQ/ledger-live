import { z } from "zod";
import { AmountWithTickerSchema } from "./bitcoin";

export const SolanaTransactionIntentSchema = z.object({
  family: z.literal("solana"),
  recipient: z.string(),
  amount: AmountWithTickerSchema,
  mode: z
    .enum(["send", "stake.createAccount", "stake.delegate", "stake.undelegate", "stake.withdraw"])
    .default("send"),
  validator: z.string().optional(),
  stakeAccount: z.string().optional(),
  memo: z.string().optional(),
});
