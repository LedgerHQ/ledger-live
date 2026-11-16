import { z } from "zod";
import { flagWith } from "../../define";

export const agentIntent = flagWith(
  {
    navBar: z.boolean().default(false),
    profile: z.boolean().default(false),
  },
  {
    enabled: false,
    params: {
      navBar: false,
      profile: false,
    },
  },
);
