import { useMemo } from "react";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { selectCardWalletsTotal } from "./selectors/selectCardWalletsTotal";
import type { CardAssetsProps } from "./types";

const NO_CURRENCIES: ReadonlyMap<string, CryptoOrTokenCurrency> = new Map();

export type CardWalletsTotal = Readonly<{
  total: number;
  isLoading: boolean;
  isError: boolean;
}>;

export function useCardWalletsTotal(
  assets: CardAssetsProps | undefined,
  isSignedIn: boolean,
): CardWalletsTotal {
  const { wallets, isLoading, isError } = useCardLinkedWallets({
    currencies: assets?.currencies ?? NO_CURRENCIES,
    skip: !isSignedIn || assets === undefined,
  });

  const priceWallet = assets?.priceWallet;

  return useMemo(() => {
    const total = selectCardWalletsTotal({ wallets, priceWallet });

    return { total, isLoading, isError };
  }, [wallets, priceWallet, isLoading, isError]);
}
