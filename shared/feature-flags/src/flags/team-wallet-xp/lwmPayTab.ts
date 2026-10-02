import { flagWith } from "../../define";
import { z } from "zod";

export const lwmPayTab = flagWith(
  {
    card_native: z.boolean(),
    card_live_app: z.boolean(),
    card_disclaimer: z.boolean(),
    legacyTopUp: z.boolean(),
  },
  {
    enabled: false,
    params: {
      card_native: false,
      card_live_app: false,
      card_disclaimer: false,
      legacyTopUp: false,
    },
  },
);
