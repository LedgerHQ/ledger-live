import { useMemo } from "react";
import type { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useOnDemandCurrencyCountervalues } from "~/hooks/useOnDemandCountervalues";

const USD = getFiatCurrencyByTicker("USD");

// Converts the amount to USD for comparable analytics. Registers the crypto→USD
// pair on demand and falls back to the user's fiat amount until the rate loads.
export function useAmountUsd(account: AccountLike, amount: BigNumber, fallback: number): number {
  const currency = useMemo(() => getAccountCurrency(account), [account]);

  useOnDemandCurrencyCountervalues(currency, USD);

  // Memoize the query so useCalculate's internal memo isn't defeated on every render.
  const query = useMemo(
    () => ({ value: amount.toNumber(), from: currency, to: USD, disableRounding: true }),
    [amount, currency],
  );
  const raw = useCalculate(query);

  return raw != null ? raw / 10 ** USD.units[0].magnitude : fallback;
}
