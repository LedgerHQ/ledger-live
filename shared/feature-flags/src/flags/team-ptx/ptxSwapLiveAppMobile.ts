import { z } from "zod";
import { flagWith } from "../../define";

export const ptxSwapLiveAppMobile = flagWith(
  {
    manifest_id: z.string(),
    currencies: z.array(z.string()).optional(),
    families: z.array(z.string()).optional(),
  },
  {
    enabled: false,
    params: { manifest_id: "swap-live-app-demo-3" },
  },
);
