import { z } from "zod";
import { flagWith } from "../../define";

export const ptxPerpsLiveApp = flagWith(
  {
    manifest_id: z.string(),
  },
  {
    enabled: false,
    params: { manifest_id: "perps-live-app" },
  },
);
