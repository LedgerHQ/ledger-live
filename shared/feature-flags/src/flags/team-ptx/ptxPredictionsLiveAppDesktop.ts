import { z } from "zod";
import { flagWith } from "../../define";

export const ptxPredictionsLiveAppDesktop = flagWith(
  {
    manifest_id: z.string(),
  },
  {
    enabled: false,
    params: { manifest_id: "predictions-live-app" },
  },
);
