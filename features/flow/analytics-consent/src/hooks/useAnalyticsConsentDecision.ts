import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import type { AnalyticsConsentInfo, PolicyVersion } from "@domain/entity-analytics-consent";
import { getAnalyticsConsentDecision } from "../decision/getAnalyticsConsentDecision";
import { resolveAnalyticsOptInParams } from "../utils/resolveAnalyticsOptInParams";
import type { AnalyticsConsentDecision } from "../types";

export type UseAnalyticsConsentDecisionResult = {
  isFeatureEnabled: boolean;
  decision: AnalyticsConsentDecision;
  /** Version to persist on a fresh consent choice or a privacy acknowledgement. */
  currentPolicyVersion: PolicyVersion | null;
};

export function useAnalyticsConsentDecision(
  storedConsentInfo: AnalyticsConsentInfo,
): UseAnalyticsConsentDecisionResult {
  const feature = useFeature("analyticsOptIn");
  const { currentPolicyVersion } = resolveAnalyticsOptInParams(feature);
  const normalizedPolicyVersion = currentPolicyVersion?.normalized ?? null;

  return useMemo(
    () => ({
      isFeatureEnabled: Boolean(feature?.enabled),
      currentPolicyVersion,
      decision: getAnalyticsConsentDecision(storedConsentInfo, { currentPolicyVersion }),
    }),
    // currentPolicyVersion is re-parsed on every render, so its normalized form keys the memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [feature?.enabled, normalizedPolicyVersion, storedConsentInfo],
  );
}
