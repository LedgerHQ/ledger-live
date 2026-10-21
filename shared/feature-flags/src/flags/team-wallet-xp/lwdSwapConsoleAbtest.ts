import { z } from "zod";
import { flagWith } from "../../define";

export const lwdSwapConsoleAbtest = flagWith(
  {
    console: z.boolean(),
    quickAction: z.boolean(),
  },
  {
    enabled: false,
    params: {
      console: true,
      quickAction: false,
    },
  },
);
