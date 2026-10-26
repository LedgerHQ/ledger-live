import { useCallback } from "react";
import { Linking } from "react-native";
import type { Account } from "@ledgerhq/types-live";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import {
  getEstimatedSigningTime,
  getSigningRecordCount,
} from "@ledgerhq/live-common/families/aleo/utils";
import type { Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { useTranslation } from "~/context/Locale";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";

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
}> | null;

export function useAleoEstimatedTimeViewModel(
  account: Account,
  transaction: Transaction,
): AleoEstimatedTimeViewModel {
  const { t } = useTranslation();
  const learnMoreUrl = useLocalizedUrl(urls.aleo.learnMore);

  const onLearnMore = useCallback(() => {
    void Linking.openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  const isAutoPickingStrategy =
    getAleoCurrencyConfigById(account.currency.id)?.recordPickingStrategy === "auto";
  const recordCount = getSigningRecordCount(transaction);
  if (!isAutoPickingStrategy || recordCount === 0) return null;

  return {
    label: t("aleo.send.amount.signingTime.label"),
    value: getEstimatedSigningTime(recordCount, t("time.second_short"), t("time.minute_short")),
    info: {
      title: t("aleo.send.amount.signingTime.label"),
      description: t("aleo.send.amount.signingTime.description"),
      confirmLabel: t("aleo.send.amount.signingTime.gotIt"),
      learnMoreLabel: t("aleo.send.amount.signingTime.learnMore"),
      onLearnMore,
    },
  };
}
