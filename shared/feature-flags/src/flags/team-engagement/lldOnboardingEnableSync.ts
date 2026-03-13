import { z } from "zod";
import { flagWith } from "../../define";

export const lldOnboardingEnableSync = flagWith(
  {
    nanos: z.boolean(),
    touchscreens: z.boolean(),
  },
  {
    enabled: false,
    params: {
      nanos: false,
      touchscreens: false,
    },
  },
);
