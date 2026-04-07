import type { AnalyticsConsentPhase } from "@ledgerhq/live-common/analyticsConsentUtils";

/** Desktop-only step: granular toggles after "Set preferences" (not used on mobile). */
export type AnalyticsConsentDialogPhase = AnalyticsConsentPhase | "preferences";
