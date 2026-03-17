import { z } from "zod";
import { flagWith } from "../../define";

export const llCounterValueGranularitiesRates = flagWith(
  {
    daily: z.number(),
    hourly: z.number(),
  },
  {
    enabled: false,
    params: {
      daily: 14 * 24 * 60 * 60 * 1000,
      hourly: 2 * 24 * 60 * 60 * 1000,
    },
  },
);
