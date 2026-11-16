import { z } from "zod";
import { flagWith } from "../../define";

export const accountDetail = flagWith(
  {
    excludedCurrencyIds: z.array(z.string()).optional(),
    analyticsBanner: z.boolean().optional(),
  },
  {
    enabled: false,
    params: { excludedCurrencyIds: [], analyticsBanner: false },
  },
);
