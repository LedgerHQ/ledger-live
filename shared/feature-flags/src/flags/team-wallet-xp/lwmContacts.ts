import { z } from "zod";
import { flagWith } from "../../define";

export const lwmContacts = flagWith(
  {
    newBadge: z.boolean(),
  },
  {
    enabled: false,
    params: {
      newBadge: false,
    },
  },
);
