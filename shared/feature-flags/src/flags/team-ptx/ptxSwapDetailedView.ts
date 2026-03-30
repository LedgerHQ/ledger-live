import { z } from "zod";
import { flagWith } from "../../define";

const abTestingVariantsSchema = z.enum(["A", "B"]);

export const ptxSwapDetailedView = flagWith(
  {
    variant: abTestingVariantsSchema,
  },
  {
    enabled: false,
    params: { variant: "A" },
  },
);
