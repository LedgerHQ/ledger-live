import { flagWith } from "../../define";
import { z } from "zod";

export const newReceiveFlow = flagWith(
  {
    excludedFamilies: z.array(z.string()),
  },
  {
    enabled: false,
    params: {
      excludedFamilies: [],
    },
  },
);
