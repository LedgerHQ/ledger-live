import { z } from "zod";
import { flagWith } from "../../define";

const analyticsOptInParamsShape = {
  /** Major/minor privacy policy version: `1`, `"1"`, `"1.0"`, `"2.10"`. Validated by `@domain/entity-analytics-consent`. */
  policyVersion: z.union([z.number(), z.string()]).default(1),
  /** Desktop only: mobile renews from `policyVersion` bumps and ignores this window. */
  consentValidityDays: z.number().int().positive().default(365),
} satisfies z.ZodRawShape;

export const analyticsOptIn = flagWith(analyticsOptInParamsShape, {
  enabled: false,
  params: {
    policyVersion: 1,
    consentValidityDays: 365,
  },
});
