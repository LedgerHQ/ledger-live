import React from "react";
import { useTranslation } from "react-i18next";
import { Button, DialogFooter } from "@ledgerhq/lumen-ui-react";
import type { AnalyticsConsentDialogPhase } from "@ledgerhq/live-common/analyticsConsentUtils";

export type AnalyticsConsentDialogFooterActionsProps = Readonly<{
  phase: AnalyticsConsentDialogPhase;
  applyOptIn: () => void;
  applyOptOut: () => void;
  onPrivacyGotIt: () => void;
}>;

export function AnalyticsConsentDialogFooterActions({
  phase,
  applyOptIn,
  applyOptOut,
  onPrivacyGotIt,
}: AnalyticsConsentDialogFooterActionsProps) {
  const { t } = useTranslation();

  return (
    <DialogFooter className="flex flex-col gap-16 pt-32">
      {phase === "privacy" ? (
        <Button appearance="base" isFull size="lg" onClick={onPrivacyGotIt}>
          {t("analyticsConsentModal.privacy.ctaGotIt")}
        </Button>
      ) : (
        <>
          <Button appearance="base" isFull size="lg" onClick={applyOptIn}>
            {phase === "consentReconfirm"
              ? t("analyticsConsentModal.reconfirm.ctaContinue")
              : t("analyticsConsentModal.fresh.ctaAcceptAll")}
          </Button>
          <Button appearance="gray" isFull size="lg" onClick={applyOptOut}>
            {phase === "consentReconfirm"
              ? t("analyticsConsentModal.reconfirm.ctaStop")
              : t("analyticsConsentModal.fresh.ctaRefuseAll")}
          </Button>
        </>
      )}
    </DialogFooter>
  );
}
