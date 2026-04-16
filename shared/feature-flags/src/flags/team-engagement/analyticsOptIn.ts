import { z } from "zod";
import { flagWith } from "../../define";

const analyticsOptInParamsShape = {
  policyVersion: z.number().finite().default(1),
  consentValidityDays: z.number().finite().int().min(1).default(365),
} satisfies z.ZodRawShape;

export const analyticsOptIn = flagWith(analyticsOptInParamsShape, {
  enabled: false,
  params: {
    policyVersion: 1,
    consentValidityDays: 365,
  },
});
