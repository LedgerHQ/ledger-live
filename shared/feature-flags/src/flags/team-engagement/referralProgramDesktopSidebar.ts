import { z } from "zod";
import { flagWith } from "../../define";

export const referralProgramDesktopSidebar = flagWith(
  {
    path: z.string(),
    isNew: z.boolean(),
    amount: z.string(),
  },
  {
    enabled: false,
    params: {
      path: "/discover/refer-a-friend",
      isNew: true,
      amount: "$20",
    },
  },
);
