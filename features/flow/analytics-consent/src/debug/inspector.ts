import {
  comparePolicyVersions,
  type AnalyticsConsentInfo,
  type PolicyVersion,
} from "@domain/entity-analytics-consent";

export type InspectorFieldTone = "success" | "error" | "warning" | "gray";

export type InspectorFieldStatus = {
  label: string;
  tone: InspectorFieldTone;
};

export function resolveStoredPolicyInspectorStatus(
  privacyPolicyVersion: AnalyticsConsentInfo["privacyPolicyVersion"],
  storedVersion: PolicyVersion | null,
  currentPolicyVersion: PolicyVersion | null,
): InspectorFieldStatus {
  if (privacyPolicyVersion === null) {
    return { label: "Missing", tone: "error" };
  }
  if (!storedVersion) {
    return { label: "Invalid", tone: "error" };
  }
  if (currentPolicyVersion && comparePolicyVersions(storedVersion, currentPolicyVersion) < 0) {
    return { label: "Valid · outdated", tone: "warning" };
  }
  return { label: "Valid", tone: "success" };
}
