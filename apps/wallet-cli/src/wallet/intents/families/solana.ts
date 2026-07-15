import { z } from "zod";
import { AmountWithTickerSchema } from "./bitcoin";

/** Stake modes that require a validator vote account (`--validator`) to build the model. */
const MODES_REQUIRING_VALIDATOR = new Set(["stake.createAccount", "stake.delegate"]);
/** Stake modes that operate on an existing stake account (`--stake-account`). */
const MODES_REQUIRING_STAKE_ACCOUNT = new Set([
  "stake.delegate",
  "stake.undelegate",
  "stake.withdraw",
]);

export const SolanaTransactionIntentSchema = z
  .object({
    family: z.literal("solana"),
    recipient: z.string(),
    amount: AmountWithTickerSchema,
    mode: z
      .enum(["send", "stake.createAccount", "stake.delegate", "stake.undelegate", "stake.withdraw"])
      .default("send"),
    validator: z.string().optional(),
    stakeAccount: z.string().optional(),
    memo: z.string().optional(),
  })
  // Fail fast on missing stake fields: without this the bridge coerces them to empty-string
  // addresses (voteAccAddr/stakeAccAddr) and coin-solana surfaces a confusing downstream error
  // instead of a clear "which flag is missing" message.
  .superRefine((intent, ctx) => {
    if (MODES_REQUIRING_VALIDATOR.has(intent.mode) && !intent.validator) {
      ctx.addIssue({
        code: "custom",
        path: ["validator"],
        message: `mode "${intent.mode}" requires a validator vote account (--validator).`,
      });
    }
    if (MODES_REQUIRING_STAKE_ACCOUNT.has(intent.mode) && !intent.stakeAccount) {
      ctx.addIssue({
        code: "custom",
        path: ["stakeAccount"],
        message: `mode "${intent.mode}" requires a stake account address (--stake-account).`,
      });
    }
  });
