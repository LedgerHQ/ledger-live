// @flow
import {
  getBalanceHistoryWithCountervalue,
  getPortfolio,
} from "@ledgerhq/live-common/lib/portfolio";
import type { Account } from "@ledgerhq/live-common/lib/types";
import {
  counterValueCurrencySelector,
  counterValueExchangeSelector,
  exchangeSettingsForTickerSelector,
  intermediaryCurrency,
  selectedTimeRangeSelector,
} from "../reducers/settings";
import CounterValues from "../countervalues";
import { accountsSelector } from "../reducers/accounts";
import type { State } from "../reducers";

export const balanceHistoryWithCountervalueSelector = (
  state: State,
  {
    account,
  }: {
    account: Account,
  },
) => {
  const range = selectedTimeRangeSelector(state);
  const counterValueCurrency = counterValueCurrencySelector(state);
  const counterValueExchange = counterValueExchangeSelector(state);
  const currency =
    account.type === "Account" ? account.currency : account.ticker;
  const exchange = exchangeSettingsForTickerSelector(state, {
    ticker: currency.ticker,
  });
  return getBalanceHistoryWithCountervalue(account, range, (_, value, date) =>
    CounterValues.calculateWithIntermediarySelector(state, {
      value,
      date,
      from: account.currency,
      fromExchange: exchange,
      intermediary: intermediaryCurrency,
      toExchange: counterValueExchange,
      to: counterValueCurrency,
    }),
  );
};

export const portfolioSelector = (state: State) => {
  const accounts = accountsSelector(state);
  const range = selectedTimeRangeSelector(state);
  const counterValueCurrency = counterValueCurrencySelector(state);
  const counterValueExchange = counterValueExchangeSelector(state);
  return getPortfolio(accounts, range, (currency, value, date) =>
    CounterValues.calculateWithIntermediarySelector(state, {
      value,
      date,
      from: currency,
      fromExchange: exchangeSettingsForTickerSelector(state, {
        ticker: currency.ticker,
      }),
      intermediary: intermediaryCurrency,
      toExchange: counterValueExchange,
      to: counterValueCurrency,
    }),
  );
};
