import { parsePolicyVersion } from "@domain/entity-analytics-consent";
import type { AnalyticsOptInParams } from "../types";

const warnedPolicyVersions = new Set<string>();

function warnOnceAboutPolicyVersion(rawPolicyVersion: unknown): void {
  const key = `${typeof rawPolicyVersion}:${String(rawPolicyVersion)}`;
  if (warnedPolicyVersions.has(key)) return;
  warnedPolicyVersions.add(key);
  console.warn(
    `[analyticsConsent] analyticsOptIn.params.policyVersion ${JSON.stringify(
      rawPolicyVersion,
    )} is invalid, policy version checks are disabled. Expected an integer or a "<major>.<minor>" string.`,
  );
}

/**
 * An invalid `policyVersion` resolves to `null` rather than a default: a remote-config
 * mistake must never prompt or silently suppress a prompt.
 */
export function resolveAnalyticsOptInParams(
  feature: { params?: unknown } | null | undefined,
): AnalyticsOptInParams {
  const rawParams = feature?.params;
  const params: Record<string, unknown> =
    rawParams && typeof rawParams === "object" ? (rawParams as Record<string, unknown>) : {};
  const currentPolicyVersion = parsePolicyVersion(params.policyVersion);

  if (currentPolicyVersion === null) {
    warnOnceAboutPolicyVersion(params.policyVersion);
  }

  return { currentPolicyVersion };
}
