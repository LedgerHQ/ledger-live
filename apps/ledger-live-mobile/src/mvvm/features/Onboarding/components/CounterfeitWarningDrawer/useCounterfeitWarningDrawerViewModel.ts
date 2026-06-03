import { useCallback, useEffect, useRef } from "react";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/devices";
import { useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import { EVENT_CONCERN, EVENT_DISMISSED, EVENT_PROCEED, EVENT_SHOWN } from "./analytics";

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

const analyticsPayload = (deviceModelId: DeviceModelId) => ({
  deviceModelId,
  flow: "Onboarding",
});

export const useCounterfeitWarningDrawerViewModel = ({
  isOpen,
  deviceModelId,
  onProceed,
  onDismiss,
}: CounterfeitWarningDrawerContainerProps): CounterfeitWarningDrawerViewProps => {
  const { t } = useTranslation();
  const hasTrackedShownRef = useRef(false);
  const closeSourceRef = useRef<CloseSource>("external");

  useEffect(() => {
    if (isOpen && !hasTrackedShownRef.current) {
      track(EVENT_SHOWN, analyticsPayload(deviceModelId));
      hasTrackedShownRef.current = true;
    }

    if (!isOpen) {
      hasTrackedShownRef.current = false;
      closeSourceRef.current = "external";
    }
  }, [deviceModelId, isOpen]);

  const handleProceed = useCallback(() => {
    closeSourceRef.current = "internal";
    track(EVENT_PROCEED, analyticsPayload(deviceModelId));
    onProceed();
  }, [deviceModelId, onProceed]);

  const handleConcern = useCallback(() => {
    closeSourceRef.current = "internal";
    track(EVENT_CONCERN, analyticsPayload(deviceModelId));
    Linking.openURL(urls.genuineCheck.learnMore);
  }, [deviceModelId]);

  const handleLedgerComLink = useCallback(() => {
    Linking.openURL(urls.ledger);
  }, []);

  const handleResellerLink = useCallback(() => {
    Linking.openURL(urls.ledgerReseller);
  }, []);

  const handleDismiss = useCallback(() => {
    if (closeSourceRef.current === "external") {
      track(EVENT_DISMISSED, analyticsPayload(deviceModelId));
    }
    closeSourceRef.current = "external";
    onDismiss();
  }, [deviceModelId, onDismiss]);

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
