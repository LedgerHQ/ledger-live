import { z } from "zod";
import { flagWith } from "../../define";

export const evmNativeStaking = flagWith(
  {
    supportedCurrencyIds: z.array(z.string()),
  },
  {
    enabled: false,
    params: { supportedCurrencyIds: [] },
  },
);
