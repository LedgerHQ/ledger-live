import { z } from "zod";
import { flagWith } from "../../define";

export const noah = flagWith(
  {
    activeCurrencyIds: z.array(z.string()),
  },
  {
    enabled: false,
    params: { activeCurrencyIds: [] },
  },
);
