import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { DeviceModelId } from "@ledgerhq/devices";
import { urls } from "~/config/urls";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { COUNTERFEIT_WARNING_BUTTON, COUNTERFEIT_WARNING_PAGE } from "./analytics";

export type CounterfeitWarningDialogContainerProps = Readonly<{
  open: boolean;
  deviceModelId: DeviceModelId;
  onProceed: () => void;
  onDismiss: () => void;
}>;

export type CounterfeitWarningDialogViewProps = Readonly<{
  open: boolean;
  title: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  onProceed: () => void;
  onLearnMore: () => void;
  onLedgerComLink: () => void;
  onResellerLink: () => void;
  onDismiss: () => void;
}>;

const eventProperties = (deviceModelId: DeviceModelId, properties: Record<string, unknown>) => ({
  deviceModelId,
  ...properties,
});

const useCounterfeitWarningDialogViewModel = ({
  open,
  deviceModelId,
  onProceed,
  onDismiss,
}: CounterfeitWarningDialogContainerProps): CounterfeitWarningDialogViewProps => {
  const { t } = useTranslation();
  const hasTrackedShownRef = useRef(false);

  useEffect(() => {
    if (open && !hasTrackedShownRef.current) {
      track(
        "page_viewed",
        eventProperties(deviceModelId, { page: COUNTERFEIT_WARNING_PAGE }),
      );
      hasTrackedShownRef.current = true;
    }

    if (!open) {
      hasTrackedShownRef.current = false;
    }
  }, [deviceModelId, open]);

  const handleProceed = useCallback(() => {
    track(
      "button_clicked",
      eventProperties(deviceModelId, {
        button: COUNTERFEIT_WARNING_BUTTON.continueSetup,
        page: COUNTERFEIT_WARNING_PAGE,
      }),
    );
    onProceed();
  }, [deviceModelId, onProceed]);

  const handleLearnMore = useCallback(() => {
    track(
      "button_clicked",
      eventProperties(deviceModelId, {
        button: COUNTERFEIT_WARNING_BUTTON.learnMore,
        page: COUNTERFEIT_WARNING_PAGE,
      }),
    );
    openURL(urls.genuineCheck);
  }, [deviceModelId]);

  const handleLedgerComLink = useCallback(() => {
    openURL(urls.ledger);
  }, []);

  const handleResellerLink = useCallback(() => {
    openURL(urls.ledgerReseller);
  }, []);

  const handleDismiss = useCallback(() => {
    track(
      "button_clicked",
      eventProperties(deviceModelId, {
        button: COUNTERFEIT_WARNING_BUTTON.close,
        page: COUNTERFEIT_WARNING_PAGE,
      }),
    );
    onDismiss();
  }, [deviceModelId, onDismiss]);

  return {
    open,
    title: t("onboarding.counterfeitWarning.title"),
    primaryCtaLabel: t("onboarding.counterfeitWarning.cta.primary"),
    secondaryCtaLabel: t("onboarding.counterfeitWarning.cta.secondary"),
    onProceed: handleProceed,
    onLearnMore: handleLearnMore,
    onLedgerComLink: handleLedgerComLink,
    onResellerLink: handleResellerLink,
    onDismiss: handleDismiss,
  };
};

export default useCounterfeitWarningDialogViewModel;
