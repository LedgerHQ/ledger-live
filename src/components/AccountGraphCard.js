// @flow

import React, { PureComponent } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { View, StyleSheet, Platform } from "react-native";
import { Trans } from "react-i18next";
import type {
  Unit,
  BalanceHistoryWithCountervalue,
  Currency,
  PortfolioRange,
  AccountLike,
} from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import type { ValueChange } from "@ledgerhq/live-common/lib/types/portfolio";

import { ensureContrast, withTheme } from "../colors";
import getWindowDimensions from "../logic/getWindowDimensions";
import { setSelectedTimeRange } from "../actions/settings";
import Delta from "./Delta";
import FormatDate from "./FormatDate";
import Graph from "./Graph";
import Pills from "./Pills";
import TransactionsPendingConfirmationWarning from "./TransactionsPendingConfirmationWarning";
import Card from "./Card";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import Placeholder from "./Placeholder";
import type { Item } from "./Graph/types";
import DiscreetModeButton from "./DiscreetModeButton";

const mapDispatchToProps = {
  setSelectedTimeRange,
};

type Props = {
  account: AccountLike,
  range: PortfolioRange,
  history: BalanceHistoryWithCountervalue,
  valueChange: ValueChange,
  countervalueAvailable: boolean,
  counterValueCurrency: Currency,
  setSelectedTimeRange: string => void,
  useCounterValue?: boolean,
  renderTitle?: ({ counterValueUnit: Unit, item: Item }) => React$Node,
  renderAccountSummary: () => ?React$Node,
  colors: *,
};

type State = {
  hoveredItem: ?Item,
};

class AccountGraphCard extends PureComponent<Props, State> {
  state = {
    hoveredItem: null,
  };

  timeRangeItems = [
    { key: "week", label: <Trans i18nKey="common:time.week" /> },
    { key: "month", label: <Trans i18nKey="common:time.month" /> },
    { key: "year", label: <Trans i18nKey="common:time.year" /> },
  ];

  onTimeRangeChange = item => this.props.setSelectedTimeRange(item.key);

  onItemHover = hoveredItem => this.setState({ hoveredItem });

  mapCryptoValue = d => d.value.toNumber();
  // $FlowFixMe
  mapCounterValue = d => (d.countervalue ? d.countervalue.toNumber() : 0);

  render() {
    const {
      account,
      countervalueAvailable,
      history,
      range,
      counterValueCurrency,
      renderTitle,
      useCounterValue,
      valueChange,
      renderAccountSummary,
      colors,
    } = this.props;

    const isAvailable = !useCounterValue || countervalueAvailable;

    const { hoveredItem } = this.state;

    const currency = getAccountCurrency(account);
    const unit = getAccountUnit(account);
    const graphColor = ensureContrast(
      getCurrencyColor(currency),
      colors.background,
    );

    return (
      <Card style={styles.root}>
        <GraphCardHeader
          account={account}
          isLoading={!isAvailable}
          to={history[history.length - 1]}
          hoveredItem={hoveredItem}
          cryptoCurrencyUnit={unit}
          counterValueUnit={counterValueCurrency.units[0]}
          renderTitle={renderTitle}
          useCounterValue={useCounterValue}
          valueChange={valueChange}
        />
        <Graph
          isInteractive={isAvailable}
          isLoading={!isAvailable}
          height={100}
          width={getWindowDimensions().width - 32}
          color={isAvailable ? graphColor : colors.grey}
          // $FlowFixMe
          data={history}
          onItemHover={this.onItemHover}
          mapValue={
            useCounterValue ? this.mapCounterValue : this.mapCryptoValue
          }
        />
        <View style={styles.pillsContainer}>
          <Pills
            isDisabled={!isAvailable}
            value={range}
            onChange={this.onTimeRangeChange}
            items={this.timeRangeItems}
          />
        </View>
        {renderAccountSummary && (
          <View style={styles.accountSummary}>{renderAccountSummary()}</View>
        )}
      </Card>
    );
  }
}

class GraphCardHeader extends PureComponent<{
  account: AccountLike,
  isLoading: boolean,
  cryptoCurrencyUnit: Unit,
  counterValueUnit: Unit,
  to: Item,
  hoveredItem: ?Item,
  renderTitle?: ({ counterValueUnit: Unit, item: Item }) => React$Node,
  useCounterValue?: boolean,
  valueChange: ValueChange,
}> {
  render() {
    const {
      useCounterValue,
      cryptoCurrencyUnit,
      counterValueUnit,
      to,
      hoveredItem,
      renderTitle,
      isLoading,
      valueChange,
      account,
    } = this.props;

    const unit = useCounterValue ? counterValueUnit : cryptoCurrencyUnit;
    const item = hoveredItem || to;

    return (
      <View style={styles.graphHeader}>
        <View style={styles.graphHeaderBalance}>
          <View style={styles.balanceTextContainer}>
            {renderTitle ? (
              renderTitle({
                counterValueUnit,
                useCounterValue,
                cryptoCurrencyUnit,
                item,
              })
            ) : (
              <View style={styles.warningWrapper}>
                <LText semiBold style={styles.balanceText}>
                  <CurrencyUnitValue unit={unit} value={item.value} />
                </LText>
                <TransactionsPendingConfirmationWarning
                  maybeAccount={account}
                />
              </View>
            )}
          </View>
          <View style={styles.subtitleContainer}>
            {isLoading ? (
              <>
                <Placeholder
                  width={50}
                  containerHeight={19}
                  style={{ marginRight: 10 }}
                />
                <Placeholder width={50} containerHeight={19} />
              </>
            ) : hoveredItem ? (
              <LText>
                <FormatDate date={hoveredItem.date} />
              </LText>
            ) : valueChange ? (
              <View style={styles.delta}>
                <Delta
                  percent
                  valueChange={valueChange}
                  style={styles.deltaPercent}
                />
                <Delta valueChange={valueChange} unit={unit} />
              </View>
            ) : null}
          </View>
        </View>
        <DiscreetModeButton />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 16,
    margin: 16,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
  warningWrapper: {
    borderWidth: 1,
    borderColor: "red",
    borderStyle: "solid",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  balanceTextContainer: {
    marginBottom: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceText: {
    fontSize: 22,
  },
  subtitleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  pillsContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  accountSummary: {
    marginTop: 16,
    alignItems: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
    overflow: "hidden",
  },
  deltaPercent: {
    marginRight: 8,
  },
  graphHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    flexWrap: "nowrap",
  },
  graphHeaderBalance: { alignItems: "flex-start", flex: 1 },
  delta: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});

export default compose(
  withTheme,
  connect(null, mapDispatchToProps),
)(AccountGraphCard);
