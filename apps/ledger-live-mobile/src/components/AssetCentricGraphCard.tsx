import React, {
  useState,
  useCallback,
  useMemo,
  ReactNode,
  memo,
  useEffect,
} from "react";
import { useTheme } from "styled-components/native";
import { AccountLike } from "@ledgerhq/types-live";
import { Unit, Currency } from "@ledgerhq/types-cryptoassets";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import {
  ValueChange,
  PortfolioRange,
  BalanceHistoryWithCountervalue,
} from "@ledgerhq/live-common/portfolio/v2/types";
import {
  Box,
  Flex,
  Text,
  Transitions,
  InfiniteLoader,
  GraphTabs,
} from "@ledgerhq/native-ui";

import { useTranslation } from "react-i18next";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useNavigation } from "@react-navigation/native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useTimeRange } from "../actions/settings";
import Delta from "./Delta";
import CurrencyUnitValue from "./CurrencyUnitValue";
import { Item } from "./Graph/types";
import { useBalanceHistoryWithCountervalue } from "../actions/portfolio";
import getWindowDimensions from "../logic/getWindowDimensions";
import Graph from "./Graph";
import Touchable from "./Touchable";
import TransactionsPendingConfirmationWarning from "./TransactionsPendingConfirmationWarning";
import { NoCountervaluePlaceholder } from "./CounterValue";
import DiscreetModeButton from "./DiscreetModeButton";

type FooterProps = {
  renderAccountSummary: () => ReactNode;
};

// const Footer = ({ renderAccountSummary }: FooterProps) => {
//   const accountSummary = renderAccountSummary && renderAccountSummary();
//   return accountSummary ? (
//     <Box
//       flexDirection={"row"}
//       alignItems={"center"}
//       marginTop={5}
//       overflow={"hidden"}
//     >
//       {accountSummary}
//     </Box>
//   ) : null;
// };

type Props = {
  assetPortfolio: Portfolio;
  counterValueCurrency: Currency;
  currentPositionY: SharedValue<number>;
  graphCardEndPosition: number;
  currency: Currency;
  areAccountsEmpty: boolean;
};

const timeRangeMapped: any = {
  all: "all",
  "1y": "year",
  "30d": "month",
  "7d": "week",
  "24h": "day",
};

function AssetCentricGraphCard({
  assetPortfolio,
  counterValueCurrency,
  currentPositionY,
  graphCardEndPosition,
  currency,
  areAccountsEmpty,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [, setTimeRange, timeRangeItems] = useTimeRange();
  const [loading, setLoading] = useState(false);
  const {
    countervalueChange,
    balanceAvailable,
    balanceHistory,
  } = assetPortfolio;

  const item = balanceHistory[balanceHistory.length - 1];
  const navigation = useNavigation();

  const unit = counterValueCurrency.units[0];

  const [hoveredItem, setHoverItem] = useState();

  const updateTimeRange = useCallback(
    index => {
      setTimeRange(timeRangeItems[index]);
    },
    [setTimeRange, timeRangeItems],
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

  return (
    <Flex flexDirection="column">
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
                      fontSize="42px"
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
                        <Text
                          variant={"body"}
                          fontWeight={"semibold"}
                          fontSize="16px"
                        >
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
        </Animated.View>
      </Flex>
      <Graph
        isInteractive={isAvailable}
        isLoading={!isAvailable}
        height={110}
        width={getWindowDimensions().width + 1}
        color={getCurrencyColor(currency) || colors.primary.c80}
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

export default memo(AssetCentricGraphCard);
