import { z } from "zod";
import { flagWith } from "../../define";

const walletSyncEnvironmentSchema = z.enum(["STAGING", "PROD"]);
const walletSyncWatchConfigSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  pollingInterval: z.number().optional(),
  initialTimeout: z.number().optional(),
  userIntentDebounce: z.number().optional(),
});

export const llmWalletSync = flagWith(
  {
    environment: walletSyncEnvironmentSchema,
    watchConfig: walletSyncWatchConfigSchema,
    learnMoreLink: z.string(),
  },
  {
    enabled: false,
    params: {
      environment: "STAGING",
      watchConfig: {},
      learnMoreLink: "",
    },
  },
);
