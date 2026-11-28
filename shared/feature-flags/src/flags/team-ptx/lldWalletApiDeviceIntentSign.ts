import { z } from "zod";
import { flagWith } from "../../define";

export const lldWalletApiDeviceIntentSign = flagWith(
  {
    variantId: z.string(),
    enabledManifestIds: z.array(z.string()),
  },
  {
    enabled: false,
    params: { variantId: "control", enabledManifestIds: ["swap-live-app-stg-aws"] },
  },
);
