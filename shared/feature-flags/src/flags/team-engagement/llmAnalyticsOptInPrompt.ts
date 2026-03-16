import { z } from "zod";
import { flagWith } from "../../define";

const abTestingVariantsSchema = z.enum(["A", "B"]);

export const llmAnalyticsOptInPrompt = flagWith(
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
