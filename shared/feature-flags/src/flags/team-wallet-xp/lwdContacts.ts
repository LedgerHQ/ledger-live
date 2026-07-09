import { z } from "zod";
import { flagWith } from "../../define";

export const lwdContacts = flagWith(
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
