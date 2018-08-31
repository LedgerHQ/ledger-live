// @flow

import React, { PureComponent, Component, Fragment } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { View, StyleSheet } from "react-native";
import { getBalanceHistorySum } from "@ledgerhq/live-common/lib/helpers/account";
import { translate } from "react-i18next";
import { BigNumber } from "bignumber.js";

import type { Unit, Currency } from "@ledgerhq/live-common/lib/types";

import colors from "../../colors";

import { accountsSelector } from "../../reducers/accounts";
import { setSelectedTimeRange } from "../../actions/settings";
import {
  exchangeSettingsForAccountSelector,
  counterValueCurrencySelector,
  counterValueExchangeSelector,
  intermediaryCurrency,
  selectedTimeRangeSelector,
  timeRangeDaysByKey,
} from "../../reducers/settings";

import CounterValues from "../../countervalues";

import Delta from "../../components/Delta";
import Space from "../../components/Space";
import Graph from "../../components/Graph";
import Pills from "../../components/Pills";
import Card from "../../components/Card";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";

import type { Item } from "../../components/Graph";
import type { T } from "../../types/common";

const mapDispatchToProps = {
  setSelectedTimeRange,
};

const mapStateToProps = state => {
  const accounts = accountsSelector(state);
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

  const balanceEnd = balanceHistory[balanceHistory.length - 1].value;

  return {
    isAvailable,
    balanceHistory,
    balanceStart: balanceHistory[0].value,
    balanceEnd,
    selectedTimeRange,
    hash: `${accounts.length > 0 ? accounts[0].id : ""}_${
      balanceHistory.length
    }_${balanceEnd.toString()}_${isAvailable.toString()}`,
    counterValueCurrency,
  };
};

type Props = {
  t: T,
  isAvailable: boolean,
  balanceHistory: Item[],
  balanceStart: BigNumber,
  balanceEnd: BigNumber,
  hash: string,
  selectedTimeRange: string,
  setSelectedTimeRange: string => void,
  counterValueCurrency: Currency,
};

type State = {
  hoveredItem: ?Item,
};

class PortfolioGraphCard extends Component<Props, State> {
  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return (
      nextProps.hash !== this.props.hash ||
      nextState.hoveredItem !== this.state.hoveredItem
    );
  }

  state = {
    hoveredItem: null,
  };

  onTimeRangeChange = item => this.props.setSelectedTimeRange(item.key);
  onItemHover = hoveredItem => this.setState({ hoveredItem });
  onHoverStop = () => this.setState({ hoveredItem: null });

  render() {
    const {
      balanceHistory,
      balanceStart,
      balanceEnd,
      selectedTimeRange,
      counterValueCurrency,
      t,
    } = this.props;

    const { hoveredItem } = this.state;

    return (
      <Card style={styles.root}>
        <PortfolioGraphCardHeader
          from={balanceStart}
          to={hoveredItem ? hoveredItem.value : balanceEnd}
          unit={counterValueCurrency.units[0]}
        />
        <Graph
          isInteractive
          data={balanceHistory}
          onItemHover={this.onItemHover}
          onHoverStop={this.onHoverStop}
        />
        <View style={styles.pillsContainer}>
          <Pills
            value={selectedTimeRange}
            onChange={this.onTimeRangeChange}
            items={[
              { key: "week", label: t("common:time.week") },
              { key: "month", label: t("common:time.month") },
              { key: "year", label: t("common:time.year") },
            ]}
          />
        </View>
      </Card>
    );
  }
}

class PortfolioGraphCardHeader extends PureComponent<{
  from: BigNumber,
  to: BigNumber,
  unit: Unit,
}> {
  render() {
    const { unit, from, to } = this.props;
    return (
      <Fragment>
        <View style={styles.balanceTextContainer}>
          <LText style={styles.balanceText}>
            <CurrencyUnitValue unit={unit} value={to} />
          </LText>
        </View>
        <View style={styles.subtitleContainer}>
          <Delta percent from={from} to={to} />
          <Space w={20} />
          <Delta from={from} to={to} unit={unit} />
        </View>
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 20,
  },
  balanceTextContainer: {
    marginBottom: 5,
    alignItems: "center",
  },
  balanceText: {
    fontSize: 22,
    color: colors.darkBlue,
  },
  subtitleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  pillsContainer: {
    marginTop: 10,
    alignItems: "center",
  },
});

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(PortfolioGraphCard);
