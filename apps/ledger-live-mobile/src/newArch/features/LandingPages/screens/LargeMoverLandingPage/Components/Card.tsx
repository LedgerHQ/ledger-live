import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Ticker } from "./Ticker";
import { LargeMoverGraph } from "./LargeMoverGraph";
import { TimeFrame } from "./TimeFrame";
import { Performance } from "./Performance";
import { PriceAndVariation } from "./PriceAndVariation";
import { Footer } from "./Footer";
import { CurrencyData, KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { Informations } from "./Information";
import { useTheme } from "styled-components/native";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

const graphRangeMap: Record<KeysPriceChange, "24h" | "7d" | "1m" | "1y"> = {
  [KeysPriceChange.hour]: "1y", // not used
  [KeysPriceChange.day]: "24h",
  [KeysPriceChange.week]: "7d",
  [KeysPriceChange.month]: "1m",
  [KeysPriceChange.year]: "1y",
};

type CardProps = CurrencyData & {
  range: KeysPriceChange;
  setRange: (range: KeysPriceChange) => void;
};

const { width } = getWindowDimensions();

export const Card: React.FC<CardProps> = ({
  id,
  price,
  priceChangePercentage,
  chartData,
  low24h,
  high24h,
  range,
  setRange,
  ticker,
  marketcap,
  totalVolume,
  marketCapChangePercentage24h,
  maxSupply,
  circulatingSupply,
  totalSupply,
  ath,
  atl,
  athDate,
  atlDate,
}) => {
  const graphWidth = width * 0.86;
  const timeframehWidth = width * 0.96;
  const { colors } = useTheme();
  const middleColor = colors.neutral.c20;
  const currency = getCryptoCurrencyById(id);

  return (
    <Flex backgroundColor="neutral.c20" borderRadius={20} marginRight={5} marginLeft={5}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Flex padding={4}>
          <Flex padding={4}>
            <Ticker currencyId={id} />
          </Flex>
          <PriceAndVariation
            price={price}
            priceChangePercentage={priceChangePercentage}
            range={range}
          />
          <Flex alignItems="center">
            <LargeMoverGraph
              chartData={chartData}
              range={graphRangeMap[range]}
              currencyId={id}
              width={graphWidth}
            />
            <TimeFrame setRange={setRange} range={range} width={timeframehWidth} />
            <Performance low={low24h} high={high24h} price={price} />
            <Flex pt={8} width="100%" pb={80}>
              <Informations
                price={price}
                ticker={ticker}
                marketCap={marketcap}
                volume={totalVolume}
                marketCapPercent={marketCapChangePercentage24h}
                fdv={maxSupply}
                circulatingSupply={circulatingSupply}
                totalSupply={totalSupply}
                allTimeHigh={ath}
                allTimeHighDate={athDate}
                allTimeLow={atl}
                allTimeLowDate={atlDate}
              />
            </Flex>
          </Flex>
        </Flex>
      </ScrollView>
      <Flex>
        <Svg style={styles.gradient}>
          <Defs>
            <LinearGradient id="midGlow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={middleColor} stopOpacity="0" />
              <Stop offset="0.5" stopColor={middleColor} stopOpacity="0.9" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="90%" height="20" fill="url(#midGlow)" />
        </Svg>
      </Flex>
      <Flex
        padding={5}
        position="absolute"
        width="100%"
        bg="neutral.c20"
        bottom={0}
        borderRadius={20}
      >
        <Footer currency={currency} />
      </Flex>
    </Flex>
  );
};

const styles = StyleSheet.create({
  gradient: {
    position: "absolute",
    bottom: 0,
    width: width,
    height: 100,
    zIndex: 1,
  },
});
