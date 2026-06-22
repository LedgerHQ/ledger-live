import React from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import Track from "~/renderer/analytics/Track";
import { AnalyticsConsentPreferencesView } from "LLD/features/AnalyticsConsentDialog/screens/AnalyticsConsentPreferencesView";
import { ANALYTICS_OPT_IN_SCREEN_B_PAGES } from "../../types";

export type AnalyticsOptInScreenBPreferencesDialogProps = Readonly<{
  isOpen: boolean;
  shouldWeTrack: boolean;
  onBackFromPreferences: () => void;
  draftShareAnalytics: boolean;
  draftSharePersonalized: boolean;
  setDraftShareAnalytics: (value: boolean) => void;
  setDraftSharePersonalized: (value: boolean) => void;
  applyPreferences: () => void;
  privacyPolicyUrl: string;
  onOpenPrivacyPolicy: () => void;
}>;

export function AnalyticsOptInScreenBPreferencesDialog({
  isOpen,
  shouldWeTrack,
  onBackFromPreferences,
  draftShareAnalytics,
  draftSharePersonalized,
  setDraftShareAnalytics,
  setDraftSharePersonalized,
  applyPreferences,
  privacyPolicyUrl,
  onOpenPrivacyPolicy,
}: AnalyticsOptInScreenBPreferencesDialogProps) {
  const page = ANALYTICS_OPT_IN_SCREEN_B_PAGES.preferences;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        data-testid="analytics-opt-in-screen-b-preferences"
        className="max-w-[480px]"
        aria-describedby={undefined}
        onPointerDownOutside={event => event.preventDefault()}
        onEscapeKeyDown={onBackFromPreferences}
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <Track onMount mandatory={shouldWeTrack} event={page} page={page} />
        <AnalyticsConsentPreferencesView
          onBackFromPreferences={onBackFromPreferences}
          draftShareAnalytics={draftShareAnalytics}
          draftSharePersonalized={draftSharePersonalized}
          setDraftShareAnalytics={setDraftShareAnalytics}
          setDraftSharePersonalized={setDraftSharePersonalized}
          applyPreferences={applyPreferences}
          privacyPolicyUrl={privacyPolicyUrl}
          onOpenPrivacyPolicy={onOpenPrivacyPolicy}
        />
      </DialogContent>
    </Dialog>
  );
}
