import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { Button, DialogBody, DialogFooter, NavBarBackButton } from "@ledgerhq/lumen-ui-react";
import { AnalyticsConsentPreferenceRow } from "../components/AnalyticsConsentPreferenceRow";
import { ConsentFooter } from "../components/ConsentFooter";

export type AnalyticsConsentPreferencesViewProps = Readonly<{
  onBackFromPreferences: () => void;
  draftShareAnalytics: boolean;
  draftSharePersonalized: boolean;
  setDraftShareAnalytics: (value: boolean) => void;
  setDraftSharePersonalized: (value: boolean) => void;
  applyPreferences: () => void;
  privacyPolicyUrl: string;
  onOpenPrivacyPolicy: () => void;
}>;

export function AnalyticsConsentPreferencesView({
  onBackFromPreferences,
  draftShareAnalytics,
  draftSharePersonalized,
  setDraftShareAnalytics,
  setDraftSharePersonalized,
  applyPreferences,
  privacyPolicyUrl,
  onOpenPrivacyPolicy,
}: AnalyticsConsentPreferencesViewProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <DialogBody className="flex flex-col items-stretch pb-16 pt-24">
        <div className="mb-64 flex w-full flex-col items-stretch gap-24 px-8">
          <div>
            <NavBarBackButton onClick={onBackFromPreferences} className="-ml-12 mb-8" />
            <DialogTitle className="heading-3-semi-bold text-base">
              {t("analyticsConsentModal.setPreferences")}
            </DialogTitle>
          </div>
          <div className="flex w-full flex-col gap-24">
            <AnalyticsConsentPreferenceRow
              title={t("analyticsConsentModal.preferences.appPerformance.title")}
              description={t("analyticsConsentModal.preferences.appPerformance.description")}
              selected={draftShareAnalytics}
              onChange={setDraftShareAnalytics}
            />
            <AnalyticsConsentPreferenceRow
              title={t("analyticsConsentModal.preferences.personalizedExperience.title")}
              description={t(
                "analyticsConsentModal.preferences.personalizedExperience.description",
              )}
              selected={draftSharePersonalized}
              onChange={setDraftSharePersonalized}
            />
          </div>
        </div>
      </DialogBody>
      <DialogFooter className="flex flex-col gap-16 pt-16">
        <Button appearance="base" isFull size="lg" onClick={applyPreferences}>
          {t("analyticsConsentModal.preferences.ctaConfirm")}
        </Button>
      </DialogFooter>
      <div className="shrink-0 px-24 pt-16">
        <ConsentFooter
          privacyPolicyUrl={privacyPolicyUrl}
          onOpenPrivacyPolicy={onOpenPrivacyPolicy}
        />
      </div>
    </div>
  );
}
