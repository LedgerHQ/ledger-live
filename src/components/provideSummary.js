// @flow

import React, { Component } from "react";
import { connect } from "react-redux";
import hoistNonReactStatic from "hoist-non-react-statics";
import createCachedSelector from "re-reselect";
import { BigNumber } from "bignumber.js";
import type {
  Account,
  Operation,
  BalanceHistory,
  Currency,
} from "@ledgerhq/live-common/lib/types";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";
import { accountsSelector } from "../reducers/accounts";
import {
  exchangeSettingsForAccountSelector,
  counterValueCurrencySelector,
  counterValueExchangeSelector,
  intermediaryCurrency,
  selectedTimeRangeSelector,
  timeRangeDaysByKey,
} from "../reducers/settings";
import CounterValues from "../countervalues";

import type { Item } from "./Graph";

export type Summary = {
  accounts: Account[],
  isAvailable: boolean,
  balanceHistory: Item[],
  balanceStart: Item,
  balanceEnd: Item,
  selectedTimeRange: string,
  setSelectedTimeRange: string => void,
  counterValueCurrency: Currency,
};

type Props = {
  summary: Summary,
  hash: string,
};

const mapStateToProps = (state, props) => {
  let accounts = accountsSelector(state);

  if (props.account) {
    accounts = accounts.filter(a => a.id === props.account.id);
  }

  const counterValueCurrency = counterValueCurrencySelector(state);
  const counterValueExchange = counterValueExchangeSelector(state);
  const selectedTimeRange = selectedTimeRangeSelector(state);
  const daysCount = timeRangeDaysByKey[selectedTimeRange];
  let isAvailable = true;

  // create array of original values, used to reconciliate
  // with counter values after calculation
  const originalValues = [];

  const balanceHistory = getBalanceHistorySum(
    accounts,
    daysCount || 30,
    (account, value, date) => {
      // keep track of original value
      originalValues.push(value);
      const fromExchange = exchangeSettingsForAccountSelector(state, {
        account,
      });

      const cv = CounterValues.calculateWithIntermediarySelector(state, {
        value,
        date,
        from: account.currency,
        fromExchange,
        intermediary: intermediaryCurrency,
        toExchange: counterValueExchange,
        to: counterValueCurrency,
      });
      if (!cv) {
        isAvailable = false;
        return BigNumber(0);
      }
      return cv;
    },
  ).map((item, i) => ({
    // reconciliate balance history with original values
    ...item,
    originalValue: originalValues[i] || BigNumber(0),
  }));

  const balanceEnd = balanceHistory[balanceHistory.length - 1];

  const summary = {
    accounts,
    isAvailable,
    balanceHistory,
    balanceStart: balanceHistory[0],
    balanceEnd,
    selectedTimeRange,
    counterValueCurrency,
  };

  return {
    summary,
  };
};

export default (WrappedComponent: any) => {
  class ProvideSummary extends Component<Props> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  }
  const Connected = connect(mapStateToProps)(ProvideSummary);
  hoistNonReactStatic(Connected, WrappedComponent);
  return Connected;
};

// ~~~ This is forked from live-common ~~~ //

function startOfDay(t) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

/**
 * generate an array of {daysCount} datapoints, one per day,
 * for the balance history of an account.
 * The last item of the array is the balance available right now.
 * @memberof helpers/account
 */
export function getBalanceHistory(
  accountOperations: Operation[],
  accountBalance: BigNumber,
  daysCount: number,
): BalanceHistory {
  const history = [];
  let i = 0; // index of operation
  let t = new Date();
  let balance = accountBalance;
  history.unshift({ date: t, value: balance });
  t = new Date(startOfDay(t) - 1); // end of yesterday
  for (let d = daysCount - 1; d > 0; d--) {
    // accumulate operations after time t
    while (i < accountOperations.length && accountOperations[i].date > t) {
      balance = balance.minus(getOperationAmountNumber(accountOperations[i]));
      i++;
    }
    history.unshift({ date: t, value: BigNumber.max(balance, 0) });
    t = new Date(t - 24 * 60 * 60 * 1000);
  }
  return history;
}

const cacheKeyForOps = (ops: Operation[]) =>
  ops.length > 0 ? `${ops[0].accountId}_${ops[0].id}_` : "";

export const balanceHistorySelector = createCachedSelector(
  (ops: Operation[]) => ops,
  (_, balance: BigNumber) => balance,
  (_, _2, count: number) => count,
  getBalanceHistory,
)(
  // our cache will consider the last op loaded to cache it all
  (ops: Operation[], balance: BigNumber, count: number) =>
    /* eslint-disable prefer-template */
    cacheKeyForOps(ops) + `${balance.toString()}_${count}`,
);

// TODO optim getBalanceHistorySum as well
export function getBalanceHistorySum(
  accounts: Account[],
  daysCount: number,
  // for a given account, calculate the countervalue of a value at given date.
  calculateAccountCounterValue: (Account, BigNumber, Date) => BigNumber,
): BalanceHistory {
  if (typeof calculateAccountCounterValue !== "function") {
    throw new Error(
      "getBalanceHistorySum signature has changed, please port the code",
    );
  }
  if (accounts.length === 0) {
    const now = Date.now();
    const zeros: BigNumber[] = Array(daysCount).fill(BigNumber(0));
    return zeros.map((value, i) => ({
      date: new Date(now - 24 * 60 * 60 * 1000 * (daysCount - i - 1)),
      value,
    }));
  }
  return accounts
    .map(account => {
      const history = balanceHistorySelector(
        account.operations,
        account.balance,
        daysCount,
      );
      return history.map(h => ({
        date: h.date,
        value: calculateAccountCounterValue(account, h.value, h.date),
      }));
    })
    .reduce((acc, history) =>
      acc.map((a, i) => ({
        date: a.date,
        value: a.value.plus(history[i].value),
      })),
    );
}
