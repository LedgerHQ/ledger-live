import type { AnalyticsConsentPhase } from "@features/flow-analytics-consent";

/** Desktop-only step: granular toggles after "Set preferences" (not used on mobile). */
export type AnalyticsConsentDialogPhase = AnalyticsConsentPhase | "preferences";
