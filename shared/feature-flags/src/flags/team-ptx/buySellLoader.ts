import { z } from "zod";
import { flagWith } from "../../define";

export const buySellLoader = flagWith(
  {
    durationMs: z.number(),
  },
  {
    enabled: false,
    params: { durationMs: 0 },
  },
);
