import { z } from "zod";
import { flagWith } from "../../define";

export const editBitcoinTx = flagWith(
  {
    supportedCurrencyIds: z.array(z.string()),
  },
  {
    enabled: false,
    params: { supportedCurrencyIds: ["bitcoin"] },
  },
);
