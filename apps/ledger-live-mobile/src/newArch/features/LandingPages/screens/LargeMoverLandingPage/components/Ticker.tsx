import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { BlurView } from "@react-native-community/blur";
import { useTheme } from "styled-components/native";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";

type TickerProps = {
  currency: CryptoOrTokenCurrency;
  width: number;
};

export const Ticker: React.FC<TickerProps> = ({ currency, width }) => {
  const theme = useTheme();
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
        backgroundColor={Platform.OS === "ios" ? "opacityDefault.c10" : "neutral.c30"}
        padding={4}
        borderRadius={40}
      >
        {Platform.OS === "ios" && (
          <BlurView
            style={{
              borderRadius: 25,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.colors.opacityDefault.c40,
            }}
            blurType={theme.theme}
            blurAmount={7}
          />
        )}
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
