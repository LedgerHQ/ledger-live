import { useCallback, useMemo } from "react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";
import { useCardCashback } from "@features/flow-pay-card-wallets";
import { usePayAnalyticsContext } from "@features/platform-pay-analytics";
import { useTranslation } from "@shared/i18n";
import type { RewardProps, RewardViewProps } from "./types";

const NO_CURRENCIES: ReadonlyMap<string, CryptoOrTokenCurrency> = new Map();

export function useRewardViewModel({
  formatters,
  currencies = NO_CURRENCIES,
  getCounterValue,
  formatCountervalue,
  onViewRewards,
}: RewardProps): RewardViewProps | null {
  const { t } = useTranslation();
  const { trackButtonClicked } = usePayAnalyticsContext();
  const isSignedIn = useIsCardSignedIn();
  const { cashback, isLoading, isError } = useCardCashback({
    currencies,
    skip: !isSignedIn,
  });

  const handleViewRewards = useCallback(
    function handleViewRewards() {
      if (!onViewRewards) return;
      trackButtonClicked({ button: "view reward currencies", page: "Card details" });
      onViewRewards();
    },
    [onViewRewards, trackButtonClicked],
  );

  return useMemo(() => {
    // An amount with no asset to name would read as a number of nothing, so the banner waits.
    if (!isSignedIn || isLoading || isError || !cashback?.currency) return null;

    const { amount: earned, currency, ratePercent, ledgerCurrency } = cashback;
    const ticker = ledgerCurrency?.ticker ?? currency.toUpperCase();

    // The programme pays in a token, so the asset's own magnitude applies rather than a fiat two.
    const amount = formatters?.amount
      ? formatters.amount(earned, currency, "crypto")
      : `${earned} ${ticker}`;

    // Any step can decline: a host that prices nothing, an asset no currency resolved for, or a
    // amount no rate covers. The banner then shows the asset amount alone, never a wrong number.
    const value =
      getCounterValue && ledgerCurrency ? getCounterValue(ledgerCurrency, earned) : null;

    return {
      amount,
      countervalue: value === null || !formatCountervalue ? null : formatCountervalue(value),
      subtitle: t("payTab.card.reward.title", { ratePercent, ticker }),
      ...(onViewRewards ? { onPress: handleViewRewards } : {}),
    };
  }, [
    isSignedIn,
    isLoading,
    isError,
    cashback,
    formatters,
    getCounterValue,
    formatCountervalue,
    t,
    onViewRewards,
    handleViewRewards,
  ]);
}
