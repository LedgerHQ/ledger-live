import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { openURL } from "~/renderer/linking";
import { useSendFlowData } from "../../../context/SendFlowContext";

const SECONDS_PER_MINUTE = 60;
const MINUTE_STEP_SECONDS = 30;

export function formatEstimatedDuration(ms: number, t: TFunction): string {
  const totalSeconds = ms / 1000;
  if (totalSeconds < SECONDS_PER_MINUTE) {
    return t("newSendFlow.estimatedTime.seconds", { count: Math.max(Math.round(totalSeconds), 1) });
  }
  const steppedSeconds = Math.floor(totalSeconds / MINUTE_STEP_SECONDS) * MINUTE_STEP_SECONDS;
  return t("newSendFlow.estimatedTime.minutes", { count: steppedSeconds / SECONDS_PER_MINUTE });
}

export type EstimatedTimeViewModel = Readonly<{
  label: string;
  value: string;
  info: Readonly<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    learnMoreLabel: string | null;
    onOpen: () => void;
    onClose: () => void;
    onLearnMore: () => void;
  }>;
}>;

export function useEstimatedTimeViewModel(): EstimatedTimeViewModel | null {
  const { t } = useTranslation();
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;
  const { transaction } = state.transaction;
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const estimatedTime = useMemo(() => {
    if (!account || !transaction) return null;
    const currency = getAccountCurrency(getMainAccount(account, parentAccount ?? undefined));
    return sendFeatures.getEstimatedTime(currency, transaction);
  }, [account, parentAccount, transaction]);

  const learnMoreUrl = estimatedTime?.learnMoreUrl;
  const onOpen = useCallback(() => setIsInfoOpen(true), []);
  const onClose = useCallback(() => setIsInfoOpen(false), []);
  const onLearnMore = useCallback(() => {
    if (learnMoreUrl) openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  if (!estimatedTime) return null;

  return {
    label: t("newSendFlow.estimatedTime.label"),
    value: formatEstimatedDuration(estimatedTime.ms, t),
    info: {
      isOpen: isInfoOpen,
      title: t(`newSendFlow.${estimatedTime.translationKey}.title`),
      description: t(`newSendFlow.${estimatedTime.translationKey}.description`),
      confirmLabel: t("newSendFlow.estimatedTime.gotIt"),
      learnMoreLabel: learnMoreUrl ? t("newSendFlow.estimatedTime.learnMore") : null,
      onOpen,
      onClose,
      onLearnMore,
    },
  };
}
