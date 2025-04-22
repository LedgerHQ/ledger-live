import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { getCryptoCurrencyById, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";

type TickerProps = {
  currencyId: string;
};

const { width } = Dimensions.get("window");

export const Ticker: React.FC<TickerProps> = ({ currencyId }) => {
  const currency = getCryptoCurrencyById(currencyId);
  const middleColor = getCurrencyColor(currency);

  return (
    <View style={styles.container}>
      <Svg style={styles.gradient}>
        <Defs>
          <LinearGradient id="midGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={middleColor} stopOpacity="0" />
            <Stop offset="0.6" stopColor={middleColor} stopOpacity="0.15" />
            <Stop offset="1" stopColor={middleColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100" fill="url(#midGlow)" />
      </Svg>

      <Flex alignItems="center">
        <Flex
          flexDirection="row"
          alignItems="center"
          backgroundColor="opacityDefault.c10"
          padding={3}
          borderRadius={40}
          width={100}
        >
          <Flex paddingLeft={2}>
            <CircleCurrencyIcon currency={currency} size={24} sizeRatio={0.9} />
          </Flex>
          <Text
            color="neutral.c100"
            textTransform="uppercase"
            marginLeft={3}
            fontSize={16}
            paddingRight={2}
          >
            {currency.explorerId}
          </Text>
        </Flex>
      </Flex>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  gradient: {
    position: "absolute",
    top: -30,
    width: width,
    height: 100,
    zIndex: 1,
  },
});
