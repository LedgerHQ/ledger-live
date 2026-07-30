import { resolveAnalyticsConsentPhase } from "../decision/resolveAnalyticsConsentPhase";
import type { AnalyticsConsentDecision } from "../types";
import type { QaExpectation } from "./scenarios";

/** Semantic tone only — apps map this to design-system colors. */
export type VerdictTone = "error" | "warning" | "success";

export type VerdictMeta = {
  title: string;
  hint: string;
  previewHint: string;
  tone: VerdictTone;
};

/** Loudest verdict first. */
export const SCENARIO_GROUPS: QaExpectation[] = ["Re-ask", "Ack only", "Quiet"];

export const VERDICT_META: Record<QaExpectation, VerdictMeta> = {
  "Re-ask": {
    title: "Full reconsent",
    hint: "Full consent drawer. Tracking pauses until answered.",
    previewHint: "Preview full consent drawer.",
    tone: "error",
  },
  "Ack only": {
    title: "Privacy only",
    hint: "Privacy ack drawer. Analytics choice unchanged.",
    previewHint: "Preview privacy ack drawer.",
    tone: "warning",
  },
  Quiet: {
    title: "No drawer",
    hint: "No drawer needed. Tracking unchanged.",
    previewHint: "Nothing to preview.",
    tone: "success",
  },
};

/** Machine reason → plain label. Keep raw codes out of UI. */
export const REASON_LABEL: Record<string, string> = {
  up_to_date: "Consent matches policy",
  minor_bump: "Minor policy update",
  major_bump: "Major policy update",
  consent_date_missing: "No consent date saved",
  consent_date_invalid: "Consent date unreadable",
  stored_version_missing: "No saved policy version",
  stored_version_invalid: "Saved version unreadable",
  stored_version_newer: "Device ahead of server",
  current_version_invalid: "Server version invalid",
  "analyticsOptIn flag is off": "Feature flag disabled",
  "onboarding incomplete": "Onboarding incomplete",
};

/**
 * Map production decision (+ optional app gate) to the QA expectation triad.
 * `blockedReason` covers app-only gates (feature off, onboarding incomplete).
 */
export function mapDecisionToQaExpectation(
  decision: AnalyticsConsentDecision,
  analyticsSharingEnabled: boolean,
  blockedReason: string | null = null,
): QaExpectation {
  if (blockedReason !== null) return "Quiet";
  const phase = resolveAnalyticsConsentPhase("closed", decision, analyticsSharingEnabled);
  if (phase === "closed") return "Quiet";
  if (phase === "privacy") return "Ack only";
  return "Re-ask";
}
