import { z } from "zod";

const analyticsOptInParamsSchema = z.object({
  policyVersion: z.coerce.number().finite().catch(1),
  consentValidityDays: z.coerce.number().finite().int().min(1).catch(365),
});

export type AnalyticsOptInParams = z.infer<typeof analyticsOptInParamsSchema>;

const defaultParams: AnalyticsOptInParams = { policyVersion: 1, consentValidityDays: 365 };

/**
 * Merges remote/partial `analyticsOptIn` params with defaults; coerces strings and recovers invalid values via `.catch()`.
 */
export function resolveAnalyticsOptInParams(
  feature: { params?: unknown } | null | undefined,
): AnalyticsOptInParams {
  const raw = feature?.params;
  if (!raw || typeof raw !== "object") {
    return analyticsOptInParamsSchema.parse(defaultParams);
  }
  return analyticsOptInParamsSchema.parse({ ...defaultParams, ...raw });
}
