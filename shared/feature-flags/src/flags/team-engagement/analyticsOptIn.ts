import { z } from "zod";
import { flagWith } from "../../define";
import { Feature } from "src/data/schema";

/** Shape for `flagWith` (strict numbers; string coercion is done in `resolveAnalyticsOptInParams`). */
const analyticsOptInParamsShape = {
  policyVersion: z.number().finite().default(1),
  consentValidityDays: z.number().finite().int().min(1).default(365),
} satisfies z.ZodRawShape;

/** For merging partial remote `params`; invalid coercions fall back via `.catch()`. */
export const analyticsOptInParamsSchema = z.object({
  policyVersion: z.coerce.number().finite().catch(1),
  consentValidityDays: z.coerce.number().finite().int().min(1).catch(365),
});

export const analyticsOptIn = flagWith(analyticsOptInParamsShape, {
  enabled: false,
  params: {
    policyVersion: 1,
    consentValidityDays: 365,
  },
});

export type AnalyticsOptInParams = z.infer<typeof analyticsOptInParamsSchema>;

/**
 * Merges remote/partial `params` with defaults and coerces invalid values per schema (.catch).
 */
export function resolveAnalyticsOptInParams(
  feature: Feature<AnalyticsOptInParams> | undefined,
): AnalyticsOptInParams {
  const defaults: AnalyticsOptInParams = { policyVersion: 1, consentValidityDays: 365 };
  const raw = feature?.params;
  if (!raw || typeof raw !== "object") {
    return analyticsOptInParamsSchema.parse(defaults);
  }
  return analyticsOptInParamsSchema.parse({ ...defaults, ...raw });
}
