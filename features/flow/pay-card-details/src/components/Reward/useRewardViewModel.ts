import { useMemo } from "react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";
import { useCardRewardWallet } from "@features/flow-pay-card-wallets";
import { useTranslation } from "@shared/i18n";
import type { RewardProps, RewardViewProps } from "./types";

const NO_CURRENCIES: ReadonlyMap<string, CryptoOrTokenCurrency> = new Map();

export function useRewardViewModel({
  formatters,
  currencies = NO_CURRENCIES,
  getCounterValue,
  formatCountervalue,
}: RewardProps): RewardViewProps | null {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const { rewardWallet, isLoading, isError } = useCardRewardWallet({
    currencies,
    skip: !isSignedIn,
  });

  return useMemo(() => {
    if (!isSignedIn || isLoading || isError || !rewardWallet) return null;

    const { balance, currency, ledgerCurrency } = rewardWallet;

    // The programme pays in a token, so the asset's own magnitude applies rather than a fiat two.
    const amount = formatters?.amount
      ? formatters.amount(balance, currency, "crypto")
      : `${balance} ${currency.toUpperCase()}`;

    // Any step can decline: a host that prices nothing, an asset no currency resolved for, or a
    // balance no rate covers. The banner then shows the asset amount alone, never a wrong number.
    const value =
      getCounterValue && ledgerCurrency ? getCounterValue(ledgerCurrency, balance) : null;

    return {
      amount,
      countervalue: value === null || !formatCountervalue ? null : formatCountervalue(value),
      subtitle: t("payTab.card.reward.title"),
    };
  }, [
    isSignedIn,
    isLoading,
    isError,
    rewardWallet,
    formatters,
    getCounterValue,
    formatCountervalue,
    t,
  ]);
}
