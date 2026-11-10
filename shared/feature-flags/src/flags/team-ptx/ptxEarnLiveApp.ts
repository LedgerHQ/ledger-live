import { z } from "zod";
import { flagWith } from "../../define";

export const ptxEarnLiveApp = flagWith(
  {
    manifest_id: z.string(),
    /** Opt-in: show the Earn deposit widget in the home right panel instead of Swap. */
    homeDepositWidget: z.boolean().optional(),
  },
  {
    enabled: true,
    params: { manifest_id: "earn" },
  },
);
