import { z } from "zod";
import { flagWith } from "../../define";

export const llmWalletApiDeviceIntentExchange = flagWith(
  {
    // A/B test variant, reported to analytics and to the swap live app.
    variantId: z.string(),
    // Live-app manifest ids for which the `custom.exchange.*` device steps run through the
    // Device Intent Executor, or "*" for every live app. Any wallet-api app that is not listed
    // keeps the legacy PlatformStartExchange / PlatformCompleteExchange screens.
    enabledManifestIds: z.array(z.string()),
  },
  {
    enabled: false,
    params: { variantId: "control", enabledManifestIds: [] },
  },
);
