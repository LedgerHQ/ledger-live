import { z } from "zod";
import { flagWith } from "../../define";

export const discover = flagWith(
  {
    version: z.string(),
  },
  {
    enabled: false,
    params: { version: "1" },
  },
);
