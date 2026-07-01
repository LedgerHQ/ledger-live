import { z } from "zod";
import { flagWith } from "../../define";

export const llmWalletApiDeviceIntentSign = flagWith(
  {
    // Live-app manifest ids for which the device-intent sign flow is enabled.
    // Any wallet-api app whose manifest id is not listed keeps the legacy flow.
    enabledManifestIds: z.array(z.string()),
  },
  {
    enabled: false,
    params: { enabledManifestIds: ["swap-live-app-stg-aws"] },
  },
);
