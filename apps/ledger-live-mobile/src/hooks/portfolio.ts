import { useSelector } from "react-redux";
import type { AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  useBalanceHistoryWithCountervalue as useBalanceHistoryWithCountervalueCommon,
  useCurrencyPortfolio as useCurrencyPortfolioCommon,
  usePortfolioThrottled,
} from "@ledgerhq/live-countervalues-react/portfolio";
import { GetPortfolioOptionsType } from "@ledgerhq/live-countervalues/portfolio";
import { selectedTimeRangeSelector } from "../reducers/settings";
import useCounterValueCurrency from "./useCounterValueCurrency";
import { accountsSelector } from "../reducers/accounts";

export function useBalanceHistoryWithCountervalue({
  account,
  range,
}: {
  account: AccountLike;
  range: PortfolioRange;
}) {
  const to = useCounterValueCurrency();

  // Call hook unconditionally, but handle null case
  const result = useBalanceHistoryWithCountervalueCommon({
    account,
    range,
    to: to!, // Non-null assertion, but we handle null below
  });

  if (!to)
    return {
      countervalueAvailable: false,
      countervalueChange: { value: 0, percentage: 0 },
      cryptoChange: { value: 0, percentage: 0 },
      history: [],
    };
  return result;
}

export function usePortfolioAllAccounts(options?: GetPortfolioOptionsType) {
  const to = useCounterValueCurrency();
  const accounts = useSelector(accountsSelector);
  const range = useSelector(selectedTimeRangeSelector);

  // Call hook unconditionally, but handle null case
  const result = usePortfolioThrottled({
    accounts,
    range,
    to: to!, // Non-null assertion, but we handle null below
    options,
  });

  if (!to)
    return {
      isAvailable: false,
      balanceHistory: [],
      balanceAvailable: false,
      totalBalance: 0,
      totalBalanceWithoutTOL: 0,
      history: [],
      availableAccounts: [],
      unavailableCurrencies: [],
      accounts: accounts || [],
      range,
      countervalueReceiveSum: 0,
      countervalueSendSum: 0,
      countervalueChange: { value: 0, percentage: 0 },
      cryptoChange: { value: 0, percentage: 0 },
      histories: [],
    };
  return result;
}

export function usePortfolioForAccounts(
  accounts: AccountLike[],
  options?: GetPortfolioOptionsType,
) {
  const to = useCounterValueCurrency();
  const range = useSelector(selectedTimeRangeSelector);

  // Call hook unconditionally, but handle null case
  const result = usePortfolioThrottled({
    accounts,
    range,
    to: to!, // Non-null assertion, but we handle null below
    options,
  });

  if (!to)
    return {
      isAvailable: false,
      balanceHistory: [],
      balanceAvailable: false,
      totalBalance: 0,
      totalBalanceWithoutTOL: 0,
      history: [],
      availableAccounts: [],
      unavailableCurrencies: [],
      accounts: accounts || [],
      range,
      countervalueReceiveSum: 0,
      countervalueSendSum: 0,
      countervalueChange: { value: 0, percentage: 0 },
      cryptoChange: { value: 0, percentage: 0 },
      histories: [],
    };
  return result;
}

export function useCurrencyPortfolio({
  currency,
  range,
}: {
  currency: CryptoCurrency | TokenCurrency;
  range: PortfolioRange;
}) {
  const accounts = useSelector(accountsSelector);
  const to = useCounterValueCurrency();

  // Call hook unconditionally, but handle null case
  const result = useCurrencyPortfolioCommon({
    accounts,
    range,
    to: to!, // Non-null assertion, but we handle null below
    currency,
  });

  if (!to)
    return {
      isAvailable: false,
      balanceHistory: [],
      balanceAvailable: false,
      totalBalance: 0,
      history: [],
      availableAccounts: [],
      unavailableCurrencies: [],
      accounts: accounts || [],
      range,
      countervalueReceiveSum: 0,
      countervalueSendSum: 0,
      countervalueChange: { value: 0, percentage: 0 },
      cryptoChange: { value: 0, percentage: 0 },
      histories: [],
    };
  return result;
}
