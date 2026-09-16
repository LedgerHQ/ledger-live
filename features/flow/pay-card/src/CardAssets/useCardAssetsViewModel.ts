import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import { useCardPricedWallets } from "./useCardPricedWallets";
import type { CardAssetRow, CardAssetsProps, CardAssetsStatus, CardAssetsViewModel } from "./types";

const KEY_PREFIX = "payTab.card.assets";

export function useCardAssetsViewModel(props: CardAssetsProps): CardAssetsViewModel {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const { wallets, isLoading, isError } = useCardPricedWallets(props, isSignedIn);
  const { formatCountervalue } = props;

  const rows = useMemo<readonly CardAssetRow[]>(
    () =>
      wallets.map(wallet => ({
        ...wallet,
        countervalue: wallet.countervalue === null ? null : formatCountervalue(wallet.countervalue),
      })),
    [wallets, formatCountervalue],
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
