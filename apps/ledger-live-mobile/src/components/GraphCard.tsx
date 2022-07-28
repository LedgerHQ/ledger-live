import React, { useCallback, useState, memo } from "react";
import { Flex, Text, GraphTabs } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import styled, { useTheme } from "styled-components/native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import Delta from "./Delta";
import TransactionsPendingConfirmationWarning from "./TransactionsPendingConfirmationWarning";
import CurrencyUnitValue from "./CurrencyUnitValue";
import { NavigatorName } from "../const";

import { useTimeRange } from "../actions/settings";
import getWindowDimensions from "../logic/getWindowDimensions";
import Graph from "./Graph";
import FormatDate from "./FormatDate";

type Props = {
  areAccountsEmpty: boolean;
  portfolio: Portfolio;
  counterValueCurrency: Currency;
  useCounterValue?: boolean;
  currentPositionY: SharedValue<number>;
  graphCardEndPosition: number;
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
}: Props) {
  const { countervalueChange, balanceAvailable, balanceHistory } = portfolio;

  const item = balanceHistory[balanceHistory.length - 1];
  const navigation = useNavigation();

  const onPieChartButtonpress = useCallback(() => {
    navigation.navigate(NavigatorName.Analytics);
  }, [navigation]);

  const unit = counterValueCurrency.units[0];

  const [hoveredItem, setHoverItem] = useState();
  const [, setTimeRange, timeRangeItems] = useTimeRange();
  const { colors } = useTheme();

  const updateTimeRange = useCallback(
    index => {
      setTimeRange(timeRangeItems[index]);
    },
    [setTimeRange, timeRangeItems],
  );

  const mapGraphValue = useCallback(d => d.value || 0, []);

  const range = portfolio.range;
  const isAvailable = portfolio.balanceAvailable;

  const rangesLabels = timeRangeItems.map(({ label }) => label);

  const activeRangeIndex = timeRangeItems.findIndex(r => r.key === range);

  const BalanceOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentPositionY.value,
      [graphCardEndPosition + 30, graphCardEndPosition + 50],
      [1, 0],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
    };
  }, [graphCardEndPosition]);

  return (
    <Flex>
      <Flex
        flexDirection={"row"}
        justifyContent={"center"}
        alignItems={"center"}
        marginTop={40}
        marginBottom={40}
      >
        <Flex alignItems="center">
          {areAccountsEmpty ? (
            <Text variant={"h3"} color={"neutral.c100"}>
              <CurrencyUnitValue unit={unit} value={0} />
            </Text>
          ) : (
            <>
              <Flex>
                {!balanceAvailable ? (
                  <BigPlaceholder mt="8px" />
                ) : (
                  <Text
                    fontFamily="Inter"
                    fontWeight="semiBold"
                    fontSize="30px"
                    color={"neutral.c100"}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    <CurrencyUnitValue
                      unit={unit}
                      value={hoveredItem ? hoveredItem.value : item.value}
                      joinFragmentsSeparator=" "
                    />
                  </Text>
                )}
                <TransactionsPendingConfirmationWarning />
              </Flex>
              <Flex flexDirection={"row"}>
                {!balanceAvailable ? (
                  <>
                    <SmallPlaceholder mt="12px" />
                  </>
                ) : (
                  <Flex flexDirection="row" alignItems="center">
                    {hoveredItem && hoveredItem.date ? (
                      <Text variant={"body"} fontWeight={"medium"}>
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
                        <Delta unit={unit} valueChange={countervalueChange} />
                      </>
                    )}
                  </Flex>
                )}
              </Flex>
            </>
          )}
        </Flex>
      </Flex>

      <Graph
        isInteractive={isAvailable}
        isLoading={!isAvailable}
        height={110}
        width={getWindowDimensions().width + 1}
        color={colors.primary.c80}
        data={balanceHistory}
        onItemHover={setHoverItem}
        mapValue={mapGraphValue}
        fill={colors.background.main}
      />
      <Flex paddingTop={6} background={colors.background.main}>
        <GraphTabs
          activeIndex={activeRangeIndex}
          onChange={updateTimeRange}
          labels={rangesLabels}
        />
      </Flex>
    </Flex>
  );
}

export default memo<Props>(GraphCard);
