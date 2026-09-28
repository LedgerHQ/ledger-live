import { flagWith } from "../../define";
import { z } from "zod";

export const lwmPayTab = flagWith(
  {
    card: z.boolean(),
    legacyTopUp: z.boolean(),
  },
  {
    enabled: false,
    params: {
      card: true,
      legacyTopUp: false,
    },
  },
);
