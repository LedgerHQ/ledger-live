import React from "react";
import { cn } from "LLD/utils/cn";
import { AnalyticsConsentScreen } from "./components/AnalyticsConsentScreen";
import { PreferencesDialog } from "./components/PreferencesDialog";
import type { useAnalyticsOptInScreenViewModel } from "./hooks/useAnalyticsOptInScreenViewModel";

export type AnalyticsOptInScreenViewProps = Readonly<
  ReturnType<typeof useAnalyticsOptInScreenViewModel>
>;

export function AnalyticsOptInScreenView({
  isOpened,
  step,
  isPreferencesDialogOpen,
  handleAcceptAll,
  handleRefuseAll,
  handlePrevious,
  handleOpenPreferences,
  handleBackFromPreferences,
  handlePreferencesDialogClosed,
  handleOpenTrackingPolicy,
  draftShareAnalytics,
  draftSharePersonalized,
  setDraftShareAnalytics,
  setDraftSharePersonalized,
  applyPreferences,
  privacyPolicyUrl,
  handleOpenPrivacyPolicy,
}: AnalyticsOptInScreenViewProps) {
  if (!isOpened) return null;

  const isPreferencesLayerActive = step === "preferences";

  return (
    <>
      <div
        className={cn("fixed inset-0 bg-black", isPreferencesLayerActive ? "z-[1]" : "z-[1000]")}
        data-testid="analytics-opt-in-screen"
      >
        <div className="relative flex h-full min-h-0 flex-col">
          <AnalyticsConsentScreen
            onAcceptAll={handleAcceptAll}
            onRefuseAll={handleRefuseAll}
            onPrevious={handlePrevious}
            onOpenPreferences={handleOpenPreferences}
            onOpenTrackingPolicy={handleOpenTrackingPolicy}
          />
        </div>
      </div>
      <PreferencesDialog
        isOpen={isPreferencesDialogOpen}
        onBackFromPreferences={handleBackFromPreferences}
        onClosed={handlePreferencesDialogClosed}
        draftShareAnalytics={draftShareAnalytics}
        draftSharePersonalized={draftSharePersonalized}
        setDraftShareAnalytics={setDraftShareAnalytics}
        setDraftSharePersonalized={setDraftSharePersonalized}
        applyPreferences={applyPreferences}
        privacyPolicyUrl={privacyPolicyUrl}
        onOpenPrivacyPolicy={handleOpenPrivacyPolicy}
      />
    </>
  );
}
