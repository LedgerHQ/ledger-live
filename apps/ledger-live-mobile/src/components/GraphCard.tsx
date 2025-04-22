import React, { useCallback, useState, memo } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Portfolio } from "@ledgerhq/types-live";
import styled, { useTheme } from "styled-components/native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  useSharedValue,
  Extrapolation,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import Delta from "./Delta";
import { TransactionsPendingConfirmationWarningAllAccounts } from "./TransactionsPendingConfirmationWarning";
import CurrencyUnitValue from "./CurrencyUnitValue";

import { useTimeRange } from "~/actions/settings";
import getWindowDimensions from "~/logic/getWindowDimensions";
import Graph from "./Graph";
import FormatDate from "./DateFormat/FormatDate";
import { track } from "~/analytics";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import EmptyGraph from "~/icons/EmptyGraph";
import { Item } from "./Graph/types";
import { Pressable } from "react-native";

const { width } = getWindowDimensions();

type Props = {
  areAccountsEmpty: boolean;
  portfolio: Portfolio;
  counterValueCurrency: Currency;
  useCounterValue?: boolean;
  currentPositionY: Animated.SharedValue<number>;
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

type TimeRangeItem = {
  label: string;
  key: string;
};

const TIME_RANGES: TimeRangeItem[] = [
  { label: "1D", key: "1d" },
  { label: "1W", key: "1w" },
  { label: "1M", key: "1m" },
  { label: "1Y", key: "1y" },
  { label: "ALL", key: "all" },
];

function GraphCard({
  portfolio,
  counterValueCurrency,
  areAccountsEmpty,
  currentPositionY,
  graphCardEndPosition,
}: Props) {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const slideAnimation = useSharedValue(0);
  const [itemWidth, setItemWidth] = useState(0);
  const { colors } = useTheme();

  const { countervalueChange, balanceHistory } = portfolio;
  const item = balanceHistory[balanceHistory.length - 1];

  const unit = counterValueCurrency.units[0];

  const [hoveredItem, setItemHover] = useState<Item | null>();
  const [, setTimeRange, timeRangeItems] = useTimeRange();
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);

  const updateTimeRange = useCallback(
    (index: number) => {
      track("timeframe_clicked", {
        timeframe: timeRangeItems[index].value,
      });
      setTimeRange(timeRangeItems[index]);
      setSelectedRangeIndex(index);

      slideAnimation.value = withSpring(index, {
        mass: 1,
        damping: 20,
        stiffness: 200,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 2,
      });
    },
    [setTimeRange, timeRangeItems, slideAnimation],
  );

  const mapGraphValue = useCallback((d: Item) => d.value || 0, []);

  const animatedBackground = useAnimatedStyle(() => {
    return {
      position: "absolute",
      width: itemWidth,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.opacityDefault.c05,
      transform: [
        {
          translateX: slideAnimation.value * itemWidth,
        },
      ],
    };
  }, [colors, itemWidth]);

  // const range = portfolio.range;
  const isAvailable = portfolio.balanceAvailable;

  //const rangesLabels = timeRangeItems.map(({ label }) => label);

  //const activeRangeIndex = timeRangeItems.findIndex(r => r.key === range);

  const BalanceOpacity = useAnimatedStyle(() => {
    // Smoother opacity transition
    const opacity = interpolate(
      currentPositionY.value,
      [graphCardEndPosition + 30, graphCardEndPosition + 50],
      [1, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [
        {
          translateY: interpolate(
            currentPositionY.value,
            [graphCardEndPosition, graphCardEndPosition + 50],
            [0, 10],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  }, [graphCardEndPosition]);

  const onItemHover = (item?: Item | null) => {
    setItemHover(item);
  };

  return (
    <Flex>
      <Flex
        flexDirection={"row"}
        justifyContent={"center"}
        alignItems={"center"}
        marginTop={4}
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
                          <Delta unit={unit} valueChange={countervalueChange} />
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

      {readOnlyModeEnabled ? (
        <EmptyGraph />
      ) : (
        <>
          <Flex>
            <Graph
              isInteractive={isAvailable}
              height={110}
              width={width + 1}
              color={colors.primary.c80}
              data={balanceHistory}
              onItemHover={onItemHover}
              mapValue={mapGraphValue}
              fill={colors.background.main}
            />
          </Flex>
          <Flex background={colors.background.main}>
            <Flex
              marginX={8}
              borderRadius={12}
              background={colors.opacityDefault.c05}
              flexDirection="row"
              justifyContent="space-around"
              alignItems="center"
              position="relative"
              overflow="hidden"
            >
              <Animated.View style={animatedBackground} />
              {TIME_RANGES.map((item, index) => (
                <Pressable
                  key={item.key}
                  onLayout={e => {
                    if (index === 0) {
                      setItemWidth(e.nativeEvent.layout.width);
                    }
                  }}
                  onPress={() => updateTimeRange(index)}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    height: 36,
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1,
                  }}
                >
                  {({ pressed }) => (
                    <Text
                      color={
                        pressed && selectedRangeIndex != index ? "neutral.c70" : "neutral.c100"
                      }
                      style={{
                        opacity: selectedRangeIndex === index ? 1 : 0.7,
                      }}
                    >
                      {item.label}
                    </Text>
                  )}
                </Pressable>
              ))}
            </Flex>
          </Flex>
        </>
      )}
    </Flex>
  );
}

export default memo<Props>(GraphCard);
