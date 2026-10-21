import { useCallback } from "react";
import { Linking } from "react-native";
import type { TFunction } from "i18next";
import {
  ESTIMATED_TIME_LEARN_MORE_URL,
  getEstimatedSendTimeMs,
} from "@ledgerhq/live-common/families/aleo/estimatedTime";
import type { Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { useTranslation } from "~/context/Locale";

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
    title: string;
    description: string;
    confirmLabel: string;
    learnMoreLabel: string;
    onLearnMore: () => void;
  }>;
}>;

export function useAleoEstimatedTimeViewModel(
  transaction: Transaction,
): AleoEstimatedTimeViewModel {
  const { t } = useTranslation();

  const onLearnMore = useCallback(() => {
    void Linking.openURL(ESTIMATED_TIME_LEARN_MORE_URL);
  }, []);

  return {
    label: t("aleo.send.estimatedTime.label"),
    value: formatEstimatedDuration(getEstimatedSendTimeMs(transaction), t),
    info: {
      title: t("aleo.send.estimatedTime.info.title"),
      description: t("aleo.send.estimatedTime.info.description"),
      confirmLabel: t("aleo.send.estimatedTime.info.gotIt"),
      learnMoreLabel: t("aleo.send.estimatedTime.info.learnMore"),
      onLearnMore,
    },
  };
}
