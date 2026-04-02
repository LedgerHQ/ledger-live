import { z } from "zod";
import { flagWith } from "../../define";

/** Fixed dust filter for incoming token operations (LWD).
 *  The threshold defaults to $0.5 but can be overridden */
export const lldHideSmallValueTokenOperations = flagWith(
  {
    thresholdUsd: z.number(),
  },
  {
    enabled: true,
    params: {
      thresholdUsd: 0.5,
    },
  },
);
