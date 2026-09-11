import { z } from "zod";
import { flagWith } from "../../define";

export const ptxEarnTransactionSuccessBanner = flagWith(
  {
    promotedTokens: z.array(z.string()),
  },
  {
    enabled: false,
    params: { promotedTokens: ["ETH", "USDC", "USDT"] },
  },
);
