import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Ticker } from "./Ticker";
import { LargeMoverGraph } from "./LargeMoverGraph";
import { TimeFrame } from "./TimeFrame";
import { Performance } from "./Performance";
import { PriceAndVariation } from "./PriceAndVariation";
import { Footer } from "./Footer";
import {
  CurrencyData,
  KeysPriceChange,
  MarketCoinDataChart,
} from "@ledgerhq/live-common/market/utils/types";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { Informations } from "./Information";
import { useTheme } from "styled-components/native";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { track } from "~/analytics";
import { PAGE_NAME } from "../const";
import { ScrollView } from "react-native-gesture-handler";

type CardProps = {
  data: CurrencyData;
  chartData?: MarketCoinDataChart;
  height: number;
  loading: boolean;
  range: KeysPriceChange;
  setRange: (range: KeysPriceChange) => void;
  currentIndex: number;
};

const { width } = getWindowDimensions();

export const Card: React.FC<CardProps> = ({
  data,
  loading,
  range,
  setRange,
  height,
  chartData,
  currentIndex,
}) => {
  const {
    id,
    price,
    priceChangePercentage,
    low24h,
    high24h,
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
  } = data;

  const graphWidth = width * 0.86;
  const timeframehWidth = width * 0.96;
  const { colors } = useTheme();
  const middleColor = colors.neutral.c20;
  const currency = getCryptoCurrencyById(id);

  const handleScroll = () => {
    track("button_clicked", {
      button: "Scroll",
      coin: currency.name,
      page: PAGE_NAME,
    });
  };

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentIndex]);

  return (
    <Flex
      backgroundColor="neutral.c20"
      borderRadius={20}
      marginRight={5}
      marginLeft={5}
      overflow="hidden"
      height={height}
    >
      <Svg style={styles.gradientTop}>
        <Defs>
          <LinearGradient id="midGlowTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={middleColor} stopOpacity="0.9" />
            <Stop offset="0.5" stopColor={middleColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={100} fill="url(#midGlowTop)" />
      </Svg>
      <Flex alignItems="center" zIndex={10} top={4}>
        <Ticker currencyId={id} width={width} />
      </Flex>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={handleScroll}
        ref={scrollRef}
      >
        <Flex padding={4} paddingTop={12}>
          <PriceAndVariation
            price={price}
            priceChangePercentage={priceChangePercentage}
            range={range}
          />
          <Flex alignItems="center">
            <LargeMoverGraph
              chartData={chartData}
              range={range}
              currencyId={id}
              width={graphWidth}
              loading={loading}
            />
            <TimeFrame
              setRange={setRange}
              range={range}
              width={timeframehWidth}
              coin={currency.name}
            />
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
        zIndex={10}
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
  gradientTop: {
    position: "absolute",
    top: -15,
    width: width,
    height: 100,
    zIndex: 1,
  },
});
