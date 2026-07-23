import { flagWith } from "../../define";
import { z } from "zod";

export const lwmPayTab = flagWith(
  {
    card: z.boolean(),
  },
  {
    enabled: false,
    params: {
      card: true,
    },
  },
);
