import { z } from "zod";
import { flagWith } from "../../define";

export const lwdContacts = flagWith(
  {
    newBadge: z.boolean(),
    eligibleAddressFamilies: z.array(z.string()),
  },
  {
    enabled: false,
    params: {
      newBadge: false,
      eligibleAddressFamilies: ["evm"],
    },
  },
);
