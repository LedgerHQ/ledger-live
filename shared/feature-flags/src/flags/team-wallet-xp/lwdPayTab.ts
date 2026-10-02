import { flagWith } from "../../define";
import { z } from "zod";

export const lwdPayTab = flagWith(
  {
    card_native: z.boolean(),
    legacyTopUp: z.boolean(),
  },
  {
    enabled: false,
    params: {
      card_native: true,
      legacyTopUp: false,
    },
  },
);
