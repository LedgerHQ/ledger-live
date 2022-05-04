// @flow
import React, { useState, useCallback } from "react";
import { useTheme } from "@react-navigation/native";
import { View, StyleSheet, Platform } from "react-native";
import type {
  Unit,
  Currency,
  AccountLike,
} from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import type {
  ValueChange,
  PortfolioRange,
  BalanceHistoryWithCountervalue,
} from "@ledgerhq/live-common/lib/portfolio/v2/types";

import { ensureContrast } from "../colors";
import getWindowDimensions from "../logic/getWindowDimensions";
import { useTimeRange } from "../actions/settings";
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

type Props = {
  account: AccountLike,
  range: PortfolioRange,
  history: BalanceHistoryWithCountervalue,
  valueChange: ValueChange,
  countervalueAvailable: boolean,
  counterValueCurrency: Currency,
  useCounterValue?: boolean,
  renderTitle?: ({
    useCounterValue?: boolean,
    cryptoCurrencyUnit: Unit,
    counterValueUnit: Unit,
    item: Item,
  }) => React$Node,
  renderAccountSummary: () => ?React$Node,
};

export default function AccountGraphCard({
  account,
  countervalueAvailable,
  history,
  range,
  counterValueCurrency,
  renderTitle,
  useCounterValue,
  valueChange,
  renderAccountSummary,
}: Props) {
  const { colors } = useTheme();
  const [hoveredItem, setHoverItem] = useState<?Item>();
  const [, setTimeRange, timeRangeItems] = useTimeRange();
  const mapCryptoValue = useCallback(d => d.value || 0, []);
  const mapCounterValue = useCallback(
    d => (d.countervalue ? d.countervalue : 0),
    [],
  );

  const isAvailable = !useCounterValue || countervalueAvailable;

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
        onItemHover={setHoverItem}
        // $FlowFixMe
        mapValue={useCounterValue ? mapCounterValue : mapCryptoValue}
      />
      <View style={styles.pillsContainer}>
        <Pills
          isDisabled={!isAvailable}
          value={range}
          onChange={setTimeRange}
          // $FlowFixMe
          items={timeRangeItems}
        />
      </View>
      {renderAccountSummary && (
        <View style={styles.accountSummary}>{renderAccountSummary()}</View>
      )}
    </Card>
  );
}

function GraphCardHeader({
  useCounterValue,
  cryptoCurrencyUnit,
  counterValueUnit,
  to,
  hoveredItem,
  renderTitle,
  isLoading,
  valueChange,
  account,
}: {
  account: AccountLike,
  isLoading: boolean,
  cryptoCurrencyUnit: Unit,
  counterValueUnit: Unit,
  to: Item,
  hoveredItem: ?Item,
  renderTitle?: ({
    useCounterValue?: boolean,
    cryptoCurrencyUnit: Unit,
    counterValueUnit: Unit,
    item: Item,
  }) => React$Node,
  useCounterValue?: boolean,
  valueChange: ValueChange,
}) {
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
              <TransactionsPendingConfirmationWarning maybeAccount={account} />
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
          ) : hoveredItem && hoveredItem.date ? (
            <LText style={styles.delta}>
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
    marginTop: 10,
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
    height: 24,
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
