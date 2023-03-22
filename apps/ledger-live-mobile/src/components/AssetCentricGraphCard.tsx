import React, { useState, useCallback, memo, useMemo } from "react";
import styled, { useTheme } from "styled-components/native";
import { Flex, Text, GraphTabs } from "@ledgerhq/native-ui";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Portfolio } from "@ledgerhq/types-live";
import { useTimeRange } from "../actions/settings";
import Delta from "./Delta";
import CurrencyUnitValue from "./CurrencyUnitValue";
import getWindowDimensions from "../logic/getWindowDimensions";
import { NoCountervaluePlaceholder } from "./CounterValue";
import Graph from "./Graph";
import { TransactionsPendingConfirmationWarningAllAccounts } from "./TransactionsPendingConfirmationWarning";
import ParentCurrencyIcon from "./ParentCurrencyIcon";
import FormatDate from "./DateFormat/FormatDate";
import { ensureContrast } from "../colors";
import { track } from "../analytics";
import { Item } from "./Graph/types";
import { Merge } from "../types/helpers";

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
  accountsEmpty?: boolean;
  currencyBalance: number;
};

function AssetCentricGraphCard({
  assetPortfolio,
  counterValueCurrency,
  currentPositionY,
  graphCardEndPosition,
  currency,
  accountsEmpty,
  currencyBalance,
}: Props) {
  const { colors } = useTheme();
  const [, setTimeRange, timeRangeItems] = useTimeRange();
  const { countervalueChange, balanceHistory } = assetPortfolio;

  const currencyUnitValue = balanceHistory[balanceHistory.length - 1];

  const unit = counterValueCurrency.units[0];

  const [hoveredItem, setHoverItem] = useState<Item | null>();

  const item = useMemo(() => {
    if (hoveredItem) {
      return { value: undefined, countervalue: hoveredItem.value };
    }
    if (accountsEmpty) {
      return { value: 0, countervalue: 0 };
    }
    return { value: currencyBalance, countervalue: currencyUnitValue.value };
  }, [hoveredItem, accountsEmpty, currencyBalance, currencyUnitValue.value]);

  const items = [
    {
      unit: currency.units[0],
      value: item.value,
    },
    {
      unit,
      value: item.countervalue,
      joinFragmentsSeparator: "",
    },
  ];

  const updateTimeRange = useCallback(
    index => {
      track("timeframe_clicked", {
        timeframe: timeRangeItems[index],
      });
      setTimeRange(timeRangeItems[index]);
    },
    [setTimeRange, timeRangeItems],
  );

  const mapCounterValue = useCallback(d => d.value || 0, []);

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

  const handleGraphTouch = useCallback(() => {
    track("graph_clicked", {
      graph: "Account Graph",
      timeframe: range,
    });
  }, [range]);

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
            <Flex alignItems="center">
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
                      minHeight={25}
                    >
                      {items[1].value ? (
                        <CurrencyUnitValue {...items[1]} />
                      ) : (
                        <NoCountervaluePlaceholder />
                      )}
                    </Text>
                    <Text
                      fontFamily="Inter"
                      fontWeight="semiBold"
                      fontSize="32px"
                      color={"neutral.c100"}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {items[0].value !== undefined ? (
                        <CurrencyUnitValue
                          {...(items[0] as Merge<
                            typeof items[0],
                            { value: number }
                          >)}
                        />
                      ) : null}
                    </Text>
                  </Flex>
                )}
                <TransactionsPendingConfirmationWarningAllAccounts />
              </Flex>
              <Flex flexDirection={"row"}>
                {!balanceHistory ? (
                  <SmallPlaceholder mt={4} />
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
            </Flex>
          </Flex>
        </Animated.View>
      </Flex>
      {accountsEmpty ? null : (
        <>
          <Flex onTouchEnd={handleGraphTouch}>
            <Graph
              isInteractive={isAvailable}
              height={110}
              width={getWindowDimensions().width + 1}
              color={graphColor}
              data={balanceHistory}
              onItemHover={setHoverItem}
              mapValue={mapCounterValue}
              fill={colors.background.main}
            />
          </Flex>
          <Flex paddingTop={6} background={colors.background.main}>
            <GraphTabs
              activeIndex={activeRangeIndex}
              onChange={updateTimeRange}
              labels={rangesLabels}
            />
          </Flex>
        </>
      )}
    </Flex>
  );
}

export default memo(AssetCentricGraphCard);
