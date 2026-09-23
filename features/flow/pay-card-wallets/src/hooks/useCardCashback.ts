import { useMemo } from "react";
import { useGetCardCashbackQuery } from "@domain/api-card-management";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CardCashbackBalance } from "../types";

export type UseCardCashbackParams = Readonly<{
  /** The same currencies the linked wallets are resolved against: the card's supported assets. */
  currencies: ReadonlyMap<string, CryptoOrTokenCurrency>;
  skip?: boolean;
}>;

export type UseCardCashbackResult = Readonly<{
  /** Absent until the read lands, and on a read that failed. */
  cashback?: CardCashbackBalance;
  isLoading: boolean;
  isError: boolean;
}>;

/**
 * The cashback the card has earned, carrying the currency it is paid in.
 *
 * The api resolves the asset to a `ledgerId`, and the currencies the host already resolved for the
 * card's assets turn that into the currency needed to price it.
 */
export function useCardCashback({
  currencies,
  skip = false,
}: UseCardCashbackParams): UseCardCashbackResult {
  const { data, isLoading, isError } = useGetCardCashbackQuery(undefined, { skip });

  return useMemo(() => {
    if (data === undefined) return { isLoading, isError };

    const ledgerCurrency = data.ledgerId === undefined ? undefined : currencies.get(data.ledgerId);

    return {
      // Left off rather than held as `undefined`, so a present key always means a resolved asset.
      cashback: { ...data, ...(ledgerCurrency === undefined ? {} : { ledgerCurrency }) },
      isLoading,
      isError,
    };
  }, [data, currencies, isLoading, isError]);
}
