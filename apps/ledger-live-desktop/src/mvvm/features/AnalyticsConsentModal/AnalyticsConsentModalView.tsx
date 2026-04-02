import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import type { AnalyticsConsentModalPhase } from "@ledgerhq/live-common/analyticsConsentUtils";

export type AnalyticsConsentModalViewProps = Readonly<{
  phase: AnalyticsConsentModalPhase;
  isModalOpen: boolean;
  applyOptIn: () => void;
  applyOptOut: () => void;
  onPrivacyGotIt: () => void;
  onSetPreferences: () => void;
}>;

export function AnalyticsConsentModalView({
  phase,
  isModalOpen,
  applyOptIn,
  applyOptOut,
  onPrivacyGotIt,
  onSetPreferences,
}: AnalyticsConsentModalViewProps) {
  const { t } = useTranslation();
  const privacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy);

  const openPrivacyPolicy = useCallback(() => {
    void openURL(privacyPolicyUrl);
  }, [privacyPolicyUrl]);

  const title =
    phase === "consentReconfirm"
      ? t("analyticsConsentModal.reconfirm.title")
      : phase === "privacy"
        ? t("analyticsConsentModal.privacy.title")
        : t("analyticsConsentModal.fresh.title");

  const descriptionLead =
    phase === "consentReconfirm"
      ? t("analyticsConsentModal.reconfirm.description")
      : phase === "privacy"
        ? null
        : t("analyticsConsentModal.fresh.description");

  return (
    <Dialog open={isModalOpen} onOpenChange={() => {}}>
      <DialogContent
        data-testid="analytics-consent-modal"
        className="max-w-[480px]"
        aria-describedby={undefined}
        onPointerDownOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <DialogHeader appearance="expanded" title={title} />
        <DialogBody className="flex flex-col gap-16">
          {phase === "privacy" ? (
            <p className="body-2 text-muted">
              {t("analyticsConsentModal.privacy.descriptionLead")}
              <button
                type="button"
                className="body-2 text-interactive underline"
                onClick={openPrivacyPolicy}
              >
                {t("analyticsConsentModal.privacy.descriptionLinkLabel")}
              </button>
              {t("analyticsConsentModal.privacy.descriptionTrail")}
            </p>
          ) : (
            <p className="body-2 text-muted">
              {descriptionLead}{" "}
              <button
                type="button"
                className="body-2 text-interactive underline"
                onClick={onSetPreferences}
              >
                {t("analyticsConsentModal.setPreferences")}
              </button>
            </p>
          )}
          <p className="body-4 text-muted">
            {t("analyticsConsentModal.footer.lead")}{" "}
            <button
              type="button"
              className="body-4 text-interactive underline"
              onClick={openPrivacyPolicy}
            >
              {t("analyticsConsentModal.footer.privacyLink")}
            </button>
          </p>
        </DialogBody>
        <DialogFooter className="flex flex-col gap-8 sm:flex-row">
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
      </DialogContent>
    </Dialog>
  );
}
