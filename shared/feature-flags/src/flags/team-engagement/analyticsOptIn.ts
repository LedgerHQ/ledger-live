import { z } from "zod";
import { flagWith } from "../../define";

const analyticsOptInParamsShape = {
  policyVersion: z.number().positive().default(1),
  consentValidityDays: z.number().int().positive().default(365),
} satisfies z.ZodRawShape;

export const analyticsOptIn = flagWith(analyticsOptInParamsShape, {
  enabled: false,
  params: {
    policyVersion: 1,
    consentValidityDays: 365,
  },
});
