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

  const getCounterValue = assets?.getCounterValue;

  return useMemo(() => {
    const total = selectCardWalletsTotal({ wallets, getCounterValue });

    return { total, isLoading, isError };
  }, [wallets, getCounterValue, isLoading, isError]);
}
