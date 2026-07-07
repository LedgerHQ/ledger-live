import { useMemo } from "react";
import type { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useOnDemandCurrencyCountervalues } from "~/hooks/useOnDemandCountervalues";

const USD = getFiatCurrencyByTicker("USD");

/**
 * Converts the transaction amount to USD, regardless of the user's chosen
 * countervalue currency, so analytics amounts are always comparable.
 *
 * The crypto→USD pair is registered on demand (it is not fetched by default
 * when the user's countervalue is not USD). While that rate is still loading,
 * we fall back to the provided value (the amount in the user's fiat).
 */
export function useAmountUsd(account: AccountLike, amount: BigNumber, fallback: number): number {
  const currency = useMemo(() => getAccountCurrency(account), [account]);

  useOnDemandCurrencyCountervalues(currency, USD);

  const raw = useCalculate({
    value: amount.toNumber(),
    from: currency,
    to: USD,
    disableRounding: true,
  });

  return raw != null ? raw / 10 ** USD.units[0].magnitude : fallback;
}
