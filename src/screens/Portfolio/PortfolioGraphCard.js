// @flow

import React, { PureComponent, Fragment } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import { BigNumber } from "bignumber.js";

import type { Unit } from "@ledgerhq/live-common/lib/types";

import type { Summary } from "../../components/provideSummary";

import colors from "../../colors";

import { setSelectedTimeRange } from "../../actions/settings";

import Delta from "../../components/Delta";
import FormatDate from "../../components/FormatDate";
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

type Props = {
  t: T,
  summary: Summary,
  setSelectedTimeRange: string => void,
};

type State = {
  hoveredItem: ?Item,
};

class PortfolioGraphCard extends PureComponent<Props, State> {
  state = {
    hoveredItem: null,
  };

  onTimeRangeChange = item => this.props.setSelectedTimeRange(item.key);
  onItemHover = hoveredItem => this.setState({ hoveredItem });
  onHoverStop = () => this.setState({ hoveredItem: null });

  render() {
    const { summary, t } = this.props;

    const {
      balanceHistory,
      balanceStart,
      balanceEnd,
      selectedTimeRange,
      counterValueCurrency,
    } = summary;

    const { hoveredItem } = this.state;

    return (
      <Card style={styles.root}>
        <PortfolioGraphCardHeader
          from={balanceStart}
          to={balanceEnd}
          hoveredItem={hoveredItem}
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
  hoveredItem: ?Item,
}> {
  render() {
    const { unit, from, to, hoveredItem } = this.props;
    return (
      <Fragment>
        <View style={styles.balanceTextContainer}>
          <LText style={styles.balanceText}>
            <CurrencyUnitValue
              unit={unit}
              value={hoveredItem ? hoveredItem.value : to}
            />
          </LText>
        </View>
        <View style={styles.subtitleContainer}>
          {hoveredItem ? (
            <LText>
              <FormatDate date={hoveredItem.date} format="LL" />
            </LText>
          ) : (
            <Fragment>
              <Delta percent from={from} to={to} style={styles.deltaPercent} />
              <Delta from={from} to={to} unit={unit} />
            </Fragment>
          )}
        </View>
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 20,
    margin: 20,
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
  deltaPercent: {
    marginRight: 20,
  },
});

export default compose(
  connect(
    null,
    mapDispatchToProps,
  ),
  translate(),
)(PortfolioGraphCard);
