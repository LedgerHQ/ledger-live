import React from "react";
import { AnalyticsOptInScreenBMainStep } from "../MainStep";
import { AnalyticsOptInScreenBPreferencesDialog } from "../PreferencesDialog";
import type { useAnalyticsOptInScreenV2ViewModel } from "../../hooks/useAnalyticsOptInScreenV2ViewModel";

export type AnalyticsOptInScreenV2ViewProps = ReturnType<typeof useAnalyticsOptInScreenV2ViewModel>;

export function AnalyticsOptInScreenV2View({
  isOpened,
  step,
  shouldWeTrack,
  handleAcceptAll,
  handleRefuseAll,
  handleOpenPreferences,
  handleBackFromPreferences,
  handleOpenTrackingPolicy,
  draftShareAnalytics,
  draftSharePersonalized,
  setDraftShareAnalytics,
  setDraftSharePersonalized,
  applyPreferences,
  privacyPolicyUrl,
  handleOpenPrivacyPolicy,
}: AnalyticsOptInScreenV2ViewProps) {
  if (!isOpened) return null;

  if (step === "preferences") {
    return (
      <AnalyticsOptInScreenBPreferencesDialog
        isOpen
        shouldWeTrack={shouldWeTrack}
        onBackFromPreferences={handleBackFromPreferences}
        draftShareAnalytics={draftShareAnalytics}
        draftSharePersonalized={draftSharePersonalized}
        setDraftShareAnalytics={setDraftShareAnalytics}
        setDraftSharePersonalized={setDraftSharePersonalized}
        applyPreferences={applyPreferences}
        privacyPolicyUrl={privacyPolicyUrl}
        onOpenPrivacyPolicy={handleOpenPrivacyPolicy}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md"
      data-testid="analytics-opt-in-screen-b"
    >
      <AnalyticsOptInScreenBMainStep
        shouldWeTrack={shouldWeTrack}
        onAcceptAll={handleAcceptAll}
        onRefuseAll={handleRefuseAll}
        onOpenPreferences={handleOpenPreferences}
        onOpenTrackingPolicy={handleOpenTrackingPolicy}
      />
    </div>
  );
}
