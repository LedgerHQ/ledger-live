import { z } from "zod";
import { flagWith } from "../../define";

const abTestingVariantsSchema = z.enum(["A", "B"]);

export const lldAnalyticsOptInPrompt = flagWith(
  {
    variant: abTestingVariantsSchema,
    entryPoints: z.array(z.string()),
  },
  {
    enabled: false,
    params: {
      variant: "A",
      entryPoints: ["Onboarding", "Portfolio"],
    },
  },
);
