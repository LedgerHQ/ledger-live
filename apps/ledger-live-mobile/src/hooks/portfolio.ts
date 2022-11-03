import { useSelector } from "react-redux";
import type { AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import type {
  TokenCurrency,
  CryptoCurrency,
} from "@ledgerhq/types-cryptoassets";
import {
  useBalanceHistoryWithCountervalue as useBalanceHistoryWithCountervalueCommon,
  usePortfolio as usePortfolioCommon,
  useCurrencyPortfolio as useCurrencyPortfolioCommon,
} from "@ledgerhq/live-common/portfolio/v2/react";
import { GetPortfolioOptionsType } from "@ledgerhq/live-common/portfolio/v2/index";
import {
  selectedTimeRangeSelector,
  counterValueCurrencySelector,
} from "../reducers/settings";
import { accountsSelector } from "../reducers/accounts";

export function useBalanceHistoryWithCountervalue({
  account,
  range,
}: {
  account: AccountLike;
  range: PortfolioRange;
}) {
  const to = useSelector(counterValueCurrencySelector);
  return useBalanceHistoryWithCountervalueCommon({
    account,
    range,
    to,
  });
}

export function usePortfolio(
  accounts?: AccountLike[],
  options?: GetPortfolioOptionsType,
) {
  const to = useSelector(counterValueCurrencySelector);
  const accountsSelected = useSelector(accountsSelector);
  const range = useSelector(selectedTimeRangeSelector);
  return usePortfolioCommon({
    accounts: accounts || accountsSelected,
    range,
    to,
    options,
  });
}

export function useCurrencyPortfolio({
  currency,
  range,
}: {
  currency: CryptoCurrency | TokenCurrency;
  range: PortfolioRange;
}) {
  const accounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  return useCurrencyPortfolioCommon({
    accounts,
    range,
    to,
    currency,
  });
}
