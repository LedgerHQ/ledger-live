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
  // Safety multiplier applied to the bridge's estimated gas limit before signing. coin-evm's gas
  // estimate carries no buffer, so gas-heavy contract calls (e.g. Morpho ERC-4626 vault deposits,
  // whose cost drifts block-to-block) can land just above the estimate and revert out-of-gas. The
  // earn pipeline sets this for vault deposit/withdraw; plain sends omit it (estimate used as-is).
  gasLimitMultiplier: z.number().gt(1).optional(),
});
