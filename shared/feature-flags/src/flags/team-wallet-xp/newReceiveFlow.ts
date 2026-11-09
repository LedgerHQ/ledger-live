import { z } from "zod";
import { flagWith } from "../../define";

export const newReceiveFlow = flagWith(
  {
    excludedFamilies: z.array(z.string()),
  },
  {
    enabled: false,
    params: { excludedFamilies: [] },
  },
);
