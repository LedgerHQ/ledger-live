import { useMemo } from "react";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CardAssetsProps, PricedCardWallet } from "./types";

const NO_CURRENCIES: ReadonlyMap<string, CryptoOrTokenCurrency> = new Map();

export function formatCardAssetCryptoAmount(balance: string | null, currency: string): string {
  const ticker = currency.toUpperCase();
  return balance === null ? ticker : `${balance} ${ticker}`;
}

export type CardPricedWallets = Readonly<{
  wallets: readonly PricedCardWallet[];
  /** The priced wallets summed, in the counter-value currency's smallest unit. */
  total: number;
  isLoading: boolean;
  isError: boolean;
}>;

/**
 * The card's funding wallets with each one's worth. Both the Assets list and the balance on the
 * card face read it, and the wallets query is the same cache entry for either.
 */
export function useCardPricedWallets(
  assets: CardAssetsProps | undefined,
  isSignedIn: boolean,
): CardPricedWallets {
  const { wallets, isLoading, isError } = useCardLinkedWallets({
    currencies: assets?.currencies ?? NO_CURRENCIES,
    skip: !isSignedIn || assets === undefined,
  });

  const priceWallet = assets?.priceWallet;

  return useMemo(() => {
    const priced = wallets.map(({ id, balance, currency, ledgerId, ledgerCurrency }) => ({
      id,
      name: ledgerCurrency?.name ?? currency.toUpperCase(),
      ticker: ledgerCurrency?.ticker ?? currency.toUpperCase(),
      ledgerId: ledgerId ?? "",
      cryptoAmount: formatCardAssetCryptoAmount(balance, currency),
      countervalue:
        priceWallet !== undefined && ledgerCurrency && balance !== null
          ? priceWallet(ledgerCurrency, balance)
          : null,
    }));

    // A wallet nothing could price adds nothing, so the total can understate what the card holds.
    const total = priced.reduce((sum, wallet) => sum + (wallet.countervalue ?? 0), 0);

    return { wallets: priced, total, isLoading, isError };
  }, [wallets, priceWallet, isLoading, isError]);
}
