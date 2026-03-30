import { z } from "zod";
import { flagWith } from "../../define";

export const ptxEarnUi = flagWith(
  {
    value: z.string(),
  },
  {
    enabled: false,
    params: { value: "v1" },
  },
);
