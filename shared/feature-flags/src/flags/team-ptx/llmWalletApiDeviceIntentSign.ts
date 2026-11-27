import { z } from "zod";
import { flagWith } from "../../define";

export const llmWalletApiDeviceIntentSign = flagWith(
  {
    variantId: z.string(),
    // Live-app manifest ids for which the device-intent sign flow is enabled.
    // Any wallet-api app whose manifest id is not listed keeps the legacy flow.
    enabledManifestIds: z.array(z.string()),
    // Manifest ids, among the enabled ones, whose users can review and edit fees before signing.
    feeSelectionManifestIds: z.array(z.string()).optional(),
  },
  {
    enabled: false,
    params: {
      variantId: "control",
      enabledManifestIds: ["swap-live-app-stg-aws", "ledger-wallet-connect"],
      feeSelectionManifestIds: ["ledger-wallet-connect"],
    },
  },
);
