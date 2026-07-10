import { z } from "zod";
import { flagWith } from "../../define";

const DEFAULT_ELIGIBLE_ADDRESS_FAMILIES = ["evm"] as const;

export const lwmContacts = flagWith(
  {
    newBadge: z.boolean(),
    eligibleAddressFamilies: z
      .array(z.string().trim().min(1))
      .min(1)
      .default(() => [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES])
      .catch(() => [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES]),
  },
  {
    enabled: false,
    params: {
      newBadge: false,
      eligibleAddressFamilies: [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES],
    },
  },
);
