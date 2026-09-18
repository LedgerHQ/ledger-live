import { useMemo } from "react";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CardAssetsProps } from "./types";

const NO_CURRENCIES: ReadonlyMap<string, CryptoOrTokenCurrency> = new Map();

export type CardWalletsTotal = Readonly<{
  /** Every wallet that could be priced, summed, in the counter-value currency's smallest unit. */
  total: number;
  isLoading: boolean;
  isError: boolean;
}>;

/**
 * What the card's funding wallets are worth altogether, for the balance on the card face.
 *
 * The provider answers no total, so it is summed here. The Assets list prices the same wallets for
 * its rows; both read one wallets query, which RTK Query serves from a single cache entry.
 */
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
    // A wallet nothing could price adds nothing, so the total can understate what the card holds.
    const total = wallets.reduce((sum, { balance, ledgerCurrency }) => {
      if (priceWallet === undefined || !ledgerCurrency || balance === null) return sum;

      return sum + (priceWallet(ledgerCurrency, balance) ?? 0);
    }, 0);

    return { total, isLoading, isError };
  }, [wallets, priceWallet, isLoading, isError]);
}
