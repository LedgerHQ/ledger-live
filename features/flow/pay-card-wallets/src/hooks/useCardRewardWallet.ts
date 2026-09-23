import { useMemo } from "react";
import { useGetRewardWalletQuery } from "@domain/api-card-management";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CardRewardWalletBalance } from "../types";

export type UseCardRewardWalletParams = Readonly<{
  /** The same currencies the linked wallets are resolved against: the card's supported assets. */
  currencies: ReadonlyMap<string, CryptoOrTokenCurrency>;
  skip?: boolean;
}>;

export type UseCardRewardWalletResult = Readonly<{
  /** Absent until the read lands, and on a read that failed. */
  rewardWallet?: CardRewardWalletBalance;
  isLoading: boolean;
  isError: boolean;
}>;

/**
 * The card's reward wallet, carrying the currency it is denominated in.
 *
 * The provider answers one wallet rather than a list, so this is the single-wallet counterpart to
 * {@link useCardLinkedWallets}: the api resolves the asset to a `ledgerId`, and the currencies the
 * host already resolved for the card's assets turn that into the currency needed to price it.
 */
export function useCardRewardWallet({
  currencies,
  skip = false,
}: UseCardRewardWalletParams): UseCardRewardWalletResult {
  const { data, isLoading, isError } = useGetRewardWalletQuery(undefined, { skip });

  return useMemo(() => {
    if (data === undefined) return { isLoading, isError };

    const ledgerCurrency = data.ledgerId === undefined ? undefined : currencies.get(data.ledgerId);

    return {
      // Left off rather than held as `undefined`, so a present key always means a resolved asset.
      rewardWallet: { ...data, ...(ledgerCurrency === undefined ? {} : { ledgerCurrency }) },
      isLoading,
      isError,
    };
  }, [data, currencies, isLoading, isError]);
}
