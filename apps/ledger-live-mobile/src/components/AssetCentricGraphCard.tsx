import React, { useState, useCallback, memo } from "react";
import styled, { useTheme } from "styled-components/native";
import { Flex, Text, GraphTabs } from "@ledgerhq/native-ui";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useTimeRange } from "../actions/settings";
import Delta from "./Delta";
import CurrencyUnitValue from "./CurrencyUnitValue";
import getWindowDimensions from "../logic/getWindowDimensions";
import Graph from "./Graph";
import TransactionsPendingConfirmationWarning from "./TransactionsPendingConfirmationWarning";
import ParentCurrencyIcon from "./ParentCurrencyIcon";
import FormatDate from "./FormatDate";
import { ensureContrast } from "../colors";
import { track } from "../analytics";
import { useCurrentRouteName } from "../helpers/routeHooks";

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

type Props = {
  assetPortfolio: Portfolio;
  counterValueCurrency: Currency;
  currentPositionY: Animated.SharedValue<number>;
  graphCardEndPosition: number;
  currency: Currency;
  areAccountsEmpty: boolean;
  currencyBalance: number;
};

function AssetCentricGraphCard({
  assetPortfolio,
  counterValueCurrency,
  currentPositionY,
  graphCardEndPosition,
  currency,
  areAccountsEmpty,
  currencyBalance,
}: Props) {
  const { colors } = useTheme();
  const currentScreen = useCurrentRouteName();
  const [itemRange, setTimeRange, timeRangeItems] = useTimeRange();
  const { countervalueChange, balanceHistory } = assetPortfolio;

  const currencyUnitValue = balanceHistory[balanceHistory.length - 1];

  const unit = counterValueCurrency.units[0];

  const [hoveredItem, setHoverItem] = useState();

  const updateTimeRange = useCallback(
    index => {
      track("timeframe_clicked", {
        timeframe: timeRangeItems[index],
        screen: currentScreen,
      });
      setTimeRange(timeRangeItems[index]);
    },
    [setTimeRange, timeRangeItems, currentScreen],
  );

  const mapGraphValue = useCallback(d => d.value || 0, []);

  const range = assetPortfolio.range;
  const isAvailable = assetPortfolio.balanceAvailable;

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

  const graphColor = ensureContrast(
    getCurrencyColor(currency),
    colors.background.main,
  );

  const onItemHover = useCallback(
    (item: any) => {
      track("graph_clicked", {
        graph: "Asset Graph",
        timeframe: itemRange,
        screen: currentScreen,
      });
      setHoverItem(item);
    },
    [currentScreen, itemRange],
  );

  return (
    <Flex flexDirection="column">
      <Flex
        flexDirection={"row"}
        justifyContent={"center"}
        alignItems={"center"}
        marginTop={9}
        marginBottom={9}
        pt={10}
      >
        <Animated.View style={[BalanceOpacity]}>
          <Flex alignItems="center">
            <ParentCurrencyIcon size={32} currency={currency} />
            {areAccountsEmpty ? (
              <Flex alignItems="center">
                <Text
                  variant={"large"}
                  fontWeight={"medium"}
                  color={"neutral.c80"}
                  mt={3}
                >
                  {!hoveredItem ? (
                    <CurrencyUnitValue
                      unit={currency.units[0]}
                      value={currencyBalance}
                      joinFragmentsSeparator=""
                    />
                  ) : null}
                </Text>
                <Text
                  fontFamily="Inter"
                  fontWeight="semiBold"
                  fontSize="32px"
                  color={"neutral.c100"}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  <CurrencyUnitValue unit={unit} value={0} />
                </Text>
              </Flex>
            ) : (
              <>
                <Flex>
                  {!balanceHistory ? (
                    <BigPlaceholder mt="8px" />
                  ) : (
                    <Flex alignItems="center">
                      <Text
                        variant={"large"}
                        fontWeight={"medium"}
                        color={"neutral.c80"}
                        mt={3}
                      >
                        {!hoveredItem ? (
                          <CurrencyUnitValue
                            unit={currency.units[0]}
                            value={currencyBalance}
                            joinFragmentsSeparator=""
                          />
                        ) : null}
                      </Text>
                      <Text
                        fontFamily="Inter"
                        fontWeight="semiBold"
                        fontSize="32px"
                        color={"neutral.c100"}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        <CurrencyUnitValue
                          unit={unit}
                          value={
                            hoveredItem
                              ? hoveredItem.value
                              : currencyUnitValue.value
                          }
                          joinFragmentsSeparator=""
                        />
                      </Text>
                    </Flex>
                  )}
                  <TransactionsPendingConfirmationWarning />
                </Flex>
                <Flex flexDirection={"row"}>
                  {!balanceHistory ? (
                    <>
                      <SmallPlaceholder mt={4} />
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
      <Graph
        isInteractive={isAvailable}
        isLoading={!isAvailable}
        height={110}
        width={getWindowDimensions().width + 1}
        color={graphColor}
        data={balanceHistory}
        onItemHover={onItemHover}
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

export default memo(AssetCentricGraphCard);
