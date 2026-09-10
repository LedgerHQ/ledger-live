import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import {
  useCardLinkedWallets,
  type ResolveWalletCounterValue,
} from "@features/flow-pay-card-wallets";
import type { CardAssetRow, CardAssetsStatus, CardAssetsViewModel } from "./types";

const KEY_PREFIX = "payTab.card.assets";

const NO_COUNTER_VALUE: ResolveWalletCounterValue = () => null;

export function formatCardAssetCryptoAmount(balance: string | null, currency: string): string {
  const ticker = currency.toUpperCase();
  return balance === null ? ticker : `${balance} ${ticker}`;
}

export function useCardAssetsViewModel(): CardAssetsViewModel {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const { wallets, isLoading, isError } = useCardLinkedWallets({
    resolveCounterValue: NO_COUNTER_VALUE,
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
