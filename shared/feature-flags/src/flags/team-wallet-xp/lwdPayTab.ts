import { flagWith } from "../../define";
import { z } from "zod";

export const lwdPayTab = flagWith(
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
