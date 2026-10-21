import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  ESTIMATED_TIME_LEARN_MORE_URL,
  getEstimatedSendTimeMs,
} from "@ledgerhq/live-common/families/aleo/estimatedTime";
import type { Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { openURL } from "~/renderer/linking";

const SECONDS_PER_MINUTE = 60;
const MINUTE_STEP_SECONDS = 30;

export function formatEstimatedDuration(ms: number, t: TFunction): string {
  const totalSeconds = ms / 1000;
  if (totalSeconds < SECONDS_PER_MINUTE) {
    return t("aleo.send.estimatedTime.seconds", { count: Math.max(Math.round(totalSeconds), 1) });
  }
  const steppedSeconds = Math.floor(totalSeconds / MINUTE_STEP_SECONDS) * MINUTE_STEP_SECONDS;
  return t("aleo.send.estimatedTime.minutes", { count: steppedSeconds / SECONDS_PER_MINUTE });
}

export type AleoEstimatedTimeViewModel = Readonly<{
  label: string;
  value: string;
  info: Readonly<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    learnMoreLabel: string;
    onOpen: () => void;
    onClose: () => void;
    onLearnMore: () => void;
  }>;
}>;

export function useAleoEstimatedTimeViewModel(
  transaction: Transaction,
): AleoEstimatedTimeViewModel {
  const { t } = useTranslation();
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const onOpen = useCallback(() => setIsInfoOpen(true), []);
  const onClose = useCallback(() => setIsInfoOpen(false), []);
  const onLearnMore = useCallback(() => openURL(ESTIMATED_TIME_LEARN_MORE_URL), []);

  return {
    label: t("aleo.send.estimatedTime.label"),
    value: formatEstimatedDuration(getEstimatedSendTimeMs(transaction), t),
    info: {
      isOpen: isInfoOpen,
      title: t("aleo.send.estimatedTime.info.title"),
      description: t("aleo.send.estimatedTime.info.description"),
      confirmLabel: t("aleo.send.estimatedTime.info.gotIt"),
      learnMoreLabel: t("aleo.send.estimatedTime.info.learnMore"),
      onOpen,
      onClose,
      onLearnMore,
    },
  };
}
