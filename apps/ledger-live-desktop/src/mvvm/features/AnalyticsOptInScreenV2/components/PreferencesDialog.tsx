import React, { useCallback } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { AnalyticsConsentPreferencesView } from "LLD/features/AnalyticsConsentDialog/screens/AnalyticsConsentPreferencesView";
import { ANALYTICS_OPT_IN_SCREEN_PAGES } from "LLD/features/AnalyticsOptInScreenV2/types";
import Track from "~/renderer/analytics/Track";

export type PreferencesDialogProps = Readonly<{
  isOpen: boolean;
  shouldWeTrack: boolean;
  onBackFromPreferences: () => void;
  onClosed: () => void;
  draftShareAnalytics: boolean;
  draftSharePersonalized: boolean;
  setDraftShareAnalytics: (value: boolean) => void;
  setDraftSharePersonalized: (value: boolean) => void;
  applyPreferences: () => void;
  privacyPolicyUrl: string;
  onOpenPrivacyPolicy: () => void;
}>;

export function PreferencesDialog({
  isOpen,
  shouldWeTrack,
  onBackFromPreferences,
  onClosed,
  draftShareAnalytics,
  draftSharePersonalized,
  setDraftShareAnalytics,
  setDraftSharePersonalized,
  applyPreferences,
  privacyPolicyUrl,
  onOpenPrivacyPolicy,
}: PreferencesDialogProps) {
  const page = ANALYTICS_OPT_IN_SCREEN_PAGES.preferences;

  const handleCloseAutoFocus = useCallback(
    (event: Event) => {
      event.preventDefault();
      if (!isOpen) onClosed();
    },
    [isOpen, onClosed],
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onBackFromPreferences();
      }}
    >
      <DialogContent
        data-testid="analytics-opt-in-screen-preferences"
        className="max-w-[480px]"
        aria-describedby={undefined}
        onPointerDownOutside={event => event.preventDefault()}
        onOpenAutoFocus={event => event.preventDefault()}
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        {isOpen ? <Track onMount mandatory={shouldWeTrack} event={page} page={page} /> : null}
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
