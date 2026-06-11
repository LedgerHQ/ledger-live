import { useCallback, useEffect, useRef } from "react";
import { Linking } from "react-native";
import type { DeviceModelId } from "@ledgerhq/devices";
import { useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import { COUNTERFEIT_WARNING_BUTTON, COUNTERFEIT_WARNING_PAGE } from "./analytics";

type CloseSource = "external" | "internal";

export type CounterfeitWarningDrawerContainerProps = Readonly<{
  isOpen: boolean;
  deviceModelId: DeviceModelId;
  onProceed: () => void;
  onDismiss: () => void;
}>;

export type CounterfeitWarningDrawerViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  onProceed: () => void;
  onConcern: () => void;
  onLedgerComLink: () => void;
  onResellerLink: () => void;
  onDismiss: () => void;
}>;

export const useCounterfeitWarningDrawerViewModel = ({
  isOpen,
  deviceModelId: _deviceModelId,
  onProceed,
  onDismiss,
}: CounterfeitWarningDrawerContainerProps): CounterfeitWarningDrawerViewProps => {
  const { t } = useTranslation();
  const hasTrackedShownRef = useRef(false);
  const closeSourceRef = useRef<CloseSource>("external");

  useEffect(() => {
    if (isOpen && !hasTrackedShownRef.current) {
      track("page_viewed", { page: COUNTERFEIT_WARNING_PAGE });
      hasTrackedShownRef.current = true;
    }

    if (!isOpen) {
      hasTrackedShownRef.current = false;
      closeSourceRef.current = "external";
    }
  }, [isOpen]);

  const handleProceed = useCallback(() => {
    closeSourceRef.current = "internal";
    track("button_clicked", {
      button: COUNTERFEIT_WARNING_BUTTON.continueSetup,
      page: COUNTERFEIT_WARNING_PAGE,
    });
    onProceed();
  }, [onProceed]);

  const handleConcern = useCallback(() => {
    closeSourceRef.current = "internal";
    track("button_clicked", {
      button: COUNTERFEIT_WARNING_BUTTON.learnMore,
      page: COUNTERFEIT_WARNING_PAGE,
    });
    Linking.openURL(urls.genuineCheck.learnMore);
  }, []);

  const handleLedgerComLink = useCallback(() => {
    Linking.openURL(urls.ledger);
  }, []);

  const handleResellerLink = useCallback(() => {
    Linking.openURL(urls.ledgerReseller);
  }, []);

  const handleDismiss = useCallback(() => {
    if (closeSourceRef.current === "external") {
      track("button_clicked", {
        button: COUNTERFEIT_WARNING_BUTTON.close,
        page: COUNTERFEIT_WARNING_PAGE,
      });
    }
    closeSourceRef.current = "external";
    onDismiss();
  }, [onDismiss]);

  return {
    isOpen,
    title: t("onboarding.counterfeitWarning.title"),
    primaryCtaLabel: t("onboarding.counterfeitWarning.cta.primary"),
    secondaryCtaLabel: t("onboarding.counterfeitWarning.cta.secondary"),
    onProceed: handleProceed,
    onConcern: handleConcern,
    onLedgerComLink: handleLedgerComLink,
    onResellerLink: handleResellerLink,
    onDismiss: handleDismiss,
  };
};
