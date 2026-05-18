import { z } from "zod";
import { flagWith } from "../../define";

export const concordiumIdAppLinks = flagWith(
  {
    appStore: z.string().url(),
    playStore: z.string().url(),
  },
  {
    enabled: true,
    params: {
      appStore: "https://apps.apple.com/app/concordium-id/id6746754485",
      playStore: "https://play.google.com/store/apps/details?id=com.idwallet.app",
    },
  },
);
