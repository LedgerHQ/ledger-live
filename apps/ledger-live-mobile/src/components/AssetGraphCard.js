// @flow
import React, { useState, useCallback } from "react";
import { useTheme } from "@react-navigation/native";
import { View, StyleSheet, Platform } from "react-native";
import type { Unit, Currency } from "@ledgerhq/live-common/types/index";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import type {
  ValueChange,
  PortfolioRange,
  BalanceHistoryWithCountervalue,
} from "@ledgerhq/live-common/portfolio/v2/types";

import { ensureContrast } from "../colors";
import { useTimeRange } from "../actions/settings";
import getWindowDimensions from "../logic/getWindowDimensions";
import Delta from "./Delta";
import FormatDate from "./FormatDate";
import Graph from "./Graph";
import Pills from "./Pills";
import Card from "./Card";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import Placeholder from "./Placeholder";
import type { Item } from "./Graph/types";
import DiscreetModeButton from "./DiscreetModeButton";
import { normalize } from "../helpers/normalizeSize";

type Props = {
  range: PortfolioRange,
  history: BalanceHistoryWithCountervalue,
  valueChange: ValueChange,
  countervalueAvailable: boolean,
  currency: Currency,
  counterValueCurrency: Currency,
  useCounterValue?: boolean,
  renderTitle?: RenderTitle,
};

export default function AssetGraphCard({
  currency,
  countervalueAvailable,
  history,
  range,
  counterValueCurrency,
  renderTitle,
  useCounterValue,
  valueChange,
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

  const unit = currency.units[0];
  const graphColor = ensureContrast(
    getCurrencyColor(currency),
    colors.background,
  );

  return (
    <Card style={styles.root}>
      <GraphCardHeader
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
    </Card>
  );
}

export type RenderTitle = ({
  counterValueUnit: Unit,
  item: Item,
  cryptoCurrencyUnit: Unit,
  useCounterValue?: boolean,
}) => React$Node;

function GraphCardHeader({
  useCounterValue,
  cryptoCurrencyUnit,
  counterValueUnit,
  to,
  hoveredItem,
  renderTitle,
  isLoading,
  valueChange,
}: {
  isLoading: boolean,
  cryptoCurrencyUnit: Unit,
  counterValueUnit: Unit,
  to: Item,
  hoveredItem: ?Item,
  renderTitle?: RenderTitle,
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
            <LText semiBold style={styles.balanceText}>
              <CurrencyUnitValue unit={unit} value={item.value} />
            </LText>
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
          ) : (
            <View style={styles.delta} />
          )}
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
  balanceTextContainer: {
    marginBottom: 5,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  balanceText: {
    fontSize: normalize(22),
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
  deltaPercent: {
    marginRight: 8,
  },
  graphHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingRight: 10,
    flexWrap: "nowrap",
  },
  graphHeaderBalance: { alignItems: "flex-start", flex: 1 },
  delta: {
    height: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingLeft: 16,
  },
});
