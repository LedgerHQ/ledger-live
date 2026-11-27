import { z } from "zod";
import { flagWith } from "../../define";

export const borrowMarkets = flagWith(
  {
    markets: z.record(z.string(), z.array(z.string())),
  },
  {
    enabled: false,
    params: { markets: {} },
  },
);
