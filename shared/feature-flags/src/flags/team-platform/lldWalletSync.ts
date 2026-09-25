import { z } from "zod";
import { flagWith } from "../../define";

const walletSyncWatchConfigSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  pollingInterval: z.number().optional(),
  initialTimeout: z.number().optional(),
  userIntentDebounce: z.number().optional(),
});

export const lldWalletSync = flagWith(
  {
    watchConfig: walletSyncWatchConfigSchema,
    learnMoreLink: z.string(),
  },
  {
    enabled: false,
    params: {
      watchConfig: {},
      learnMoreLink: "",
    },
  },
);
