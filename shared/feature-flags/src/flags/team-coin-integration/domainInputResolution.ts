import { z } from "zod";
import { flagWith } from "../../define";

export const domainInputResolution = flagWith(
  {
    supportedCurrencyIds: z.array(z.string()),
  },
  {
    enabled: false,
    params: { supportedCurrencyIds: ["ethereum", "solana"] },
  },
);
