// @flow
import {
  getBalanceHistoryWithCountervalue,
  getPortfolio,
} from "@ledgerhq/live-common/lib/portfolio";
import type {
  Account,
  TokenAccount,
  PortfolioRange,
} from "@ledgerhq/live-common/lib/types";
import {
  counterValueCurrencySelector,
  exchangeSettingsForPairSelector,
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
    range,
  }: {
    account: Account | TokenAccount,
    range: PortfolioRange,
  },
) => {
  const counterValueCurrency = counterValueCurrencySelector(state);
  const currency =
    account.type === "Account" ? account.currency : account.token;
  const intermediary = intermediaryCurrency(currency, counterValueCurrency);
  const exchange = exchangeSettingsForPairSelector(state, {
    from: currency,
    to: intermediary,
  });
  const toExchange = exchangeSettingsForPairSelector(state, {
    from: intermediary,
    to: counterValueCurrency,
  });
  return getBalanceHistoryWithCountervalue(account, range, (_, value, date) =>
    CounterValues.calculateWithIntermediarySelector(state, {
      value,
      date,
      from: currency,
      fromExchange: exchange,
      intermediary,
      toExchange,
      to: counterValueCurrency,
    }),
  );
};

export const portfolioSelector = (state: State) => {
  const accounts = accountsSelector(state);
  const range = selectedTimeRangeSelector(state);
  const counterValueCurrency = counterValueCurrencySelector(state);
  return getPortfolio(accounts, range, (currency, value, date) => {
    const intermediary = intermediaryCurrency(currency, counterValueCurrency);
    const toExchange = exchangeSettingsForPairSelector(state, {
      from: intermediary,
      to: counterValueCurrency,
    });
    return CounterValues.calculateWithIntermediarySelector(state, {
      value,
      date,
      from: currency,
      fromExchange: exchangeSettingsForPairSelector(state, {
        from: currency,
        to: intermediary,
      }),
      intermediary,
      toExchange,
      to: counterValueCurrency,
    });
  });
};
