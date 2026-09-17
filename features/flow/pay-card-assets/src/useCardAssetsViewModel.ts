import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@shared/i18n";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import {
  useCardLinkedWallets,
  type ResolveWalletCounterValue,
} from "@features/flow-pay-card-wallets";
import type { CardAssetRow, CardAssetsProps, CardAssetsStatus, CardAssetsViewModel } from "./types";

const KEY_PREFIX = "payTab.card.assets";

const NO_COUNTER_VALUE: ResolveWalletCounterValue = () => null;

export function formatCardAssetTicker(currency: string): string {
  return currency.toUpperCase();
}

export function formatCardAssetCryptoAmount(
  balance: string | null,
  currency: string,
): string | null {
  return balance === null ? null : `${balance} ${formatCardAssetTicker(currency)}`;
}

export function useCardAssetsViewModel({ onAddAsset }: CardAssetsProps = {}): CardAssetsViewModel {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const [manage, setManage] = useState<"closed" | "open">("closed");
  const { wallets, isLoading, isError } = useCardLinkedWallets({
    resolveCounterValue: NO_COUNTER_VALUE,
    skip: !isSignedIn,
  });

  const rows = useMemo<readonly CardAssetRow[]>(
    () =>
      wallets.map(({ id, balance, currency, ledgerId }) => ({
        id,
        ticker: formatCardAssetTicker(currency),
        cryptoAmount: formatCardAssetCryptoAmount(balance, currency),
        ledgerId,
      })),
    [wallets],
  );

  const status = useMemo<CardAssetsStatus>(() => {
    if (isLoading) return "loading";
    if (isError) return "error";
    if (rows.length === 0) return "empty";
    return "ready";
  }, [isLoading, isError, rows.length]);

  const onManagePress = useCallback(() => setManage("open"), []);
  const onManageClose = useCallback(() => setManage("closed"), []);

  return useMemo(
    () => ({
      isVisible: isSignedIn,
      title: t(`${KEY_PREFIX}.title`),
      status,
      rows,
      emptyLabel: t(`${KEY_PREFIX}.empty`),
      errorLabel: t(`${KEY_PREFIX}.error`),
      manageLabel: t(`${KEY_PREFIX}.manage`),
      manageTitle: t(`${KEY_PREFIX}.manageTitle`),
      addAssetLabel: t(`${KEY_PREFIX}.add`),
      manage,
      onManagePress,
      onManageClose,
      onAddAsset,
    }),
    [isSignedIn, t, status, rows, manage, onManagePress, onManageClose, onAddAsset],
  );
}
