import { z } from "zod";
import { flagWith } from "../../define";

export const ptxPerpsLiveApp = flagWith(
  {
    manifest_id: z.string(),
    portfolio_entry_point_position: z.enum(["top", "bottom"]),
  },
  {
    enabled: false,
    params: {
      manifest_id: "perps-live-app",
      portfolio_entry_point_position: "bottom",
    },
  },
);
