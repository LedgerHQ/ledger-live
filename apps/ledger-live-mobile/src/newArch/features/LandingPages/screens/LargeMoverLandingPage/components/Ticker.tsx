import React from "react";
import { View, StyleSheet } from "react-native";
import { getCryptoCurrencyById, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

type TickerProps = {
  currencyId: string;
  width: number;
};

export const Ticker: React.FC<TickerProps> = ({ currencyId, width }) => {
  const currency = getCryptoCurrencyById(currencyId);
  const midColor = getCurrencyColor(currency);
  return (
    <View style={styles.container}>
      <Svg style={[styles.gradientTop, { width: width }]}>
        <Defs>
          <LinearGradient id="midGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={midColor} stopOpacity="0" />
            <Stop offset="0.6" stopColor={midColor} stopOpacity="0.15" />
            <Stop offset="1" stopColor={midColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100" fill="url(#midGlow)" />
      </Svg>
      <Flex
        flexDirection="row"
        alignItems="center"
        backgroundColor="opacityDefault.c10"
        padding={4}
        borderRadius={40}
      >
        <Flex>
          <CircleCurrencyIcon currency={currency} size={24} sizeRatio={0.9} />
        </Flex>
        <Text color="neutral.c100" textTransform="uppercase" marginLeft={3} fontSize={16}>
          {currency.ticker}
        </Text>
      </Flex>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  gradientTop: {
    position: "absolute",
    top: -15,
    height: 100,
    zIndex: 1,
  },
});
