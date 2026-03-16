import { z } from "zod";
import { flagWith } from "../../define";

export const ptxPerpsLiveAppMobile = flagWith(
  {
    manifest_id: z.string(),
  },
  {
    enabled: false,
    params: { manifest_id: "perps-live-app" },
  },
);
