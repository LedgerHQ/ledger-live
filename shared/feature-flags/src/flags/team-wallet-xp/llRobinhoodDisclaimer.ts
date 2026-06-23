import { z } from "zod";
import { flagWith } from "../../define";

export const llRobinhoodDisclaimer = flagWith(
  {
    url: z.string(),
  },
  {
    enabled: false,
    params: {
      url: "https://robinhood.com",
    },
  },
);
