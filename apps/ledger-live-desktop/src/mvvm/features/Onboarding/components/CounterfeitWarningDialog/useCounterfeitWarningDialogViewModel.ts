import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/devices";
import { urls } from "~/config/urls";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import {
  EVENT_DISMISSED,
  EVENT_LEARN_MORE,
  EVENT_PROCEED,
  EVENT_SHOWN,
} from "./analytics";

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
      track(EVENT_SHOWN, { deviceModelId });
      hasTrackedShownRef.current = true;
    }

    if (!open) {
      hasTrackedShownRef.current = false;
    }
  }, [deviceModelId, open]);

  const handleProceed = useCallback(() => {
    track(EVENT_PROCEED, { deviceModelId });
    onProceed();
  }, [deviceModelId, onProceed]);

  const handleLearnMore = useCallback(() => {
    track(EVENT_LEARN_MORE, { deviceModelId });
    openURL(urls.genuineCheck);
  }, [deviceModelId]);

  const handleLedgerComLink = useCallback(() => {
    openURL(urls.ledger);
  }, []);

  const handleResellerLink = useCallback(() => {
    openURL(urls.ledgerReseller);
  }, []);

  const handleDismiss = useCallback(() => {
    track(EVENT_DISMISSED, { deviceModelId });
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
