import { z } from "zod";
import { flagWith } from "../../define";

export const ptxEarnLiveApp = flagWith(
  {
    manifest_id: z.string(),
  },
  {
    enabled: true,
    params: { manifest_id: "earn" },
  },
);
