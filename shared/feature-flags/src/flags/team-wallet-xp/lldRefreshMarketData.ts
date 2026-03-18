import { z } from "zod";
import { flagWith } from "../../define";

export const lldRefreshMarketData = flagWith(
  {
    refreshTime: z.number(),
  },
  {
    enabled: false,
    params: { refreshTime: 3 },
  },
);
