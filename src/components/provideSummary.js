// @flow

import React, { Component } from "react";
import { connect } from "react-redux";
import { getBalanceHistorySum } from "@ledgerhq/live-common/lib/helpers/account";
import hoistNonReactStatic from "hoist-non-react-statics";
import { BigNumber } from "bignumber.js";

import type { Currency, Account } from "@ledgerhq/live-common/lib/types";

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
    hash: `${accounts.length > 0 ? accounts[0].id : ""}_${
      balanceHistory.length
    }_${balanceEnd.value.toString()}_${isAvailable.toString()}`,
  };
};

export default (WrappedComponent: any) => {
  class Inner extends Component<Props> {
    shouldComponentUpdate(nextProps: Props) {
      return nextProps.hash !== this.props.hash;
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  }
  const Connected = connect(mapStateToProps)(Inner);
  hoistNonReactStatic(Connected, WrappedComponent);
  return Connected;
};
