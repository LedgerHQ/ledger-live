import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import type { CardAssetRow, CardAssetsStatus, CardAssetsViewModel } from "./types";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

const KEY_PREFIX = "payTab.card.assets";

const NO_CURRENCIES: ReadonlyMap<string, CryptoOrTokenCurrency> = new Map();

export function formatCardAssetCryptoAmount(balance: string | null, currency: string): string {
  const ticker = currency.toUpperCase();
  return balance === null ? ticker : `${balance} ${ticker}`;
}

export function useCardAssetsViewModel(): CardAssetsViewModel {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const { wallets, isLoading, isError } = useCardLinkedWallets({
    currencies: NO_CURRENCIES,
    skip: !isSignedIn,
  });

  const rows = useMemo<readonly CardAssetRow[]>(
    () =>
      wallets.map(({ id, balance, currency }) => ({
        id,
        cryptoAmount: formatCardAssetCryptoAmount(balance, currency),
      })),
    [wallets],
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
