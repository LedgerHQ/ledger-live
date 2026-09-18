import { useMemo } from "react";
import { useGetRewardWalletQuery } from "@domain/api-card-management";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";
import { useTranslation } from "@shared/i18n";
import type { RewardProps, RewardViewProps } from "./types";

export function useRewardViewModel({ formatters }: RewardProps): RewardViewProps | null {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const { data, isLoading, isError } = useGetRewardWalletQuery(undefined, {
    skip: !isSignedIn,
  });

  return useMemo(() => {
    if (!isSignedIn || isLoading || isError || !data) return null;

    const amount = formatters?.amount
      ? formatters.amount(data.balance, data.currency, "fiat")
      : `${data.balance} ${data.currency.toUpperCase()}`;

    return {
      amount,
      subtitle: t("payTab.card.reward.title"),
    };
  }, [isSignedIn, isLoading, isError, data, formatters, t]);
}
