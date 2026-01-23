import React, { useCallback, useState, memo } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Portfolio } from "@ledgerhq/types-live";
import styled, { useTheme } from "styled-components/native";
import Animated, {
  SharedValue,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSelector } from "~/context/hooks";
import Delta from "./Delta";
import { TransactionsPendingConfirmationWarningAllAccounts } from "./TransactionsPendingConfirmationWarning";
import CurrencyUnitValue from "./CurrencyUnitValue";

import { useTimeRange } from "~/actions/settings";
import FormatDate from "./DateFormat/FormatDate";
import { track } from "~/analytics";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { Item } from "./Graph/types";
import { GestureResponderEvent } from "react-native";
import GraphSection from "./GraphSection";

type Props = {
  areAccountsEmpty: boolean;
  portfolio: Portfolio;
  counterValueCurrency: Currency;
  useCounterValue?: boolean;
  currentPositionY: SharedValue<number>;
  graphCardEndPosition: number;
  onTouchEndGraph?: (event: GestureResponderEvent) => void;
  hideGraph?: boolean;
};

const Placeholder = styled(Flex).attrs({
  backgroundColor: "neutral.c40",
  borderRadius: "4px",
})``;
const BigPlaceholder = styled(Placeholder).attrs({
  width: 189,
  height: 18,
})``;

const SmallPlaceholder = styled(Placeholder).attrs({
  width: 109,
  height: 8,
  borderRadius: "2px",
})``;

function GraphCard({
  portfolio,
  counterValueCurrency,
  areAccountsEmpty,
  currentPositionY,
  graphCardEndPosition,
  onTouchEndGraph,
  hideGraph,
}: Props) {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const { countervalueChange, balanceHistory } = portfolio;
  const item = balanceHistory[balanceHistory.length - 1];

  const unit = counterValueCurrency.units[0];

  const [hoveredItem, setItemHover] = useState<Item | null>();
  const [, setTimeRange, timeRangeItems] = useTimeRange();
  const { colors } = useTheme();

  const updateTimeRange = useCallback(
    (index: number) => {
      track("timeframe_clicked", {
        timeframe: timeRangeItems[index].value,
      });
      setTimeRange(timeRangeItems[index]);
    },
    [setTimeRange, timeRangeItems],
  );

  const mapGraphValue = useCallback((d: Item) => d.value || 0, []);

  const range = portfolio.range;
  const isAvailable = portfolio.balanceAvailable;

  const rangesLabels = timeRangeItems.map(({ label }) => label);

  const activeRangeIndex = timeRangeItems.findIndex(r => r.key === range);

  const BalanceOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentPositionY.value,
      [graphCardEndPosition + 30, graphCardEndPosition + 50],
      [1, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
    };
  }, [currentPositionY, graphCardEndPosition]);

  const onItemHover = (item?: Item | null) => {
    setItemHover(item);
  };

  return (
    <Flex background="transparent">
      <Flex
        flexDirection={"row"}
        justifyContent={"center"}
        alignItems={"center"}
        marginTop={40}
        marginBottom={40}
      >
        <Animated.View style={[BalanceOpacity]}>
          <Flex alignItems="center">
            {areAccountsEmpty ? (
              <Text
                fontFamily="Inter"
                fontWeight="semiBold"
                fontSize="42px"
                color={"neutral.c100"}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                <CurrencyUnitValue unit={unit} value={0} />
              </Text>
            ) : (
              <>
                <Flex px={6}>
                  {!balanceHistory ? (
                    <BigPlaceholder mt="8px" />
                  ) : (
                    <Text
                      fontFamily="Inter"
                      fontWeight="semiBold"
                      fontSize="42px"
                      color={"neutral.c100"}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      testID={"graphCard-balance"}
                    >
                      <CurrencyUnitValue
                        unit={unit}
                        value={hoveredItem ? hoveredItem.value : item.value}
                        joinFragmentsSeparator=""
                      />
                    </Text>
                  )}
                  <TransactionsPendingConfirmationWarningAllAccounts />
                </Flex>
                <Flex flexDirection={"row"}>
                  {!balanceHistory ? (
                    <>
                      <SmallPlaceholder mt="12px" />
                    </>
                  ) : (
                    <Flex flexDirection="row" alignItems="center">
                      {hoveredItem && hoveredItem.date ? (
                        <Text variant={"large"} fontWeight={"semiBold"}>
                          <FormatDate date={hoveredItem.date} />
                        </Text>
                      ) : (
                        <>
                          <Delta
                            percent
                            show0Delta
                            valueChange={countervalueChange}
                            // range={portfolio.range}
                          />
                          <Text> </Text>
                          <Delta
                            unit={unit}
                            valueChange={countervalueChange}
                            testID="graphCard-balance-delta"
                          />
                        </>
                      )}
                    </Flex>
                  )}
                </Flex>
              </>
            )}
          </Flex>
        </Animated.View>
      </Flex>

      {!hideGraph && (
        <GraphSection
          readOnlyModeEnabled={readOnlyModeEnabled}
          onTouchEndGraph={onTouchEndGraph}
          isAvailable={isAvailable}
          balanceHistory={balanceHistory}
          onItemHover={onItemHover}
          mapGraphValue={mapGraphValue}
          primaryColor={colors.primary.c80}
          activeRangeIndex={activeRangeIndex}
          updateTimeRange={updateTimeRange}
          rangesLabels={rangesLabels}
        />
      )}
    </Flex>
  );
}

export default memo<Props>(GraphCard);
