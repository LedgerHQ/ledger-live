import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import type { CardAssetRow, CardAssetsProps, CardAssetsStatus, CardAssetsViewModel } from "./types";

const KEY_PREFIX = "payTab.card.assets";

export function formatCardAssetCryptoAmount(balance: string | null, currency: string): string {
  const ticker = currency.toUpperCase();
  return balance === null ? ticker : `${balance} ${ticker}`;
}

export function useCardAssetsViewModel({
  currencies,
  priceWallet,
  formatCountervalue,
}: CardAssetsProps): CardAssetsViewModel {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const { wallets, isLoading, isError } = useCardLinkedWallets({
    currencies,
    skip: !isSignedIn,
  });

  const rows = useMemo<readonly CardAssetRow[]>(
    () =>
      wallets.map(({ id, balance, currency, ledgerId, ledgerCurrency }) => {
        const countervalue =
          ledgerCurrency && balance !== null ? priceWallet(ledgerCurrency, balance) : null;

        return {
          id,
          name: ledgerCurrency?.name ?? currency.toUpperCase(),
          ticker: ledgerCurrency?.ticker ?? currency.toUpperCase(),
          ledgerId: ledgerId ?? "",
          cryptoAmount: formatCardAssetCryptoAmount(balance, currency),
          countervalue: countervalue === null ? null : formatCountervalue(countervalue),
        };
      }),
    [wallets, priceWallet, formatCountervalue],
  );

  const status = useMemo<CardAssetsStatus>(() => {
    if (isLoading) return "loading";
    if (isError) return "error";
    if (rows.length === 0) return "empty";
    return "ready";
  }, [isLoading, isError, rows.length]);

  return useMemo(
    () => ({
      isVisible: isSignedIn,
      title: t(`${KEY_PREFIX}.title`),
      status,
      rows,
      emptyLabel: t(`${KEY_PREFIX}.empty`),
      errorLabel: t(`${KEY_PREFIX}.error`),
    }),
    [isSignedIn, t, status, rows],
  );
}
