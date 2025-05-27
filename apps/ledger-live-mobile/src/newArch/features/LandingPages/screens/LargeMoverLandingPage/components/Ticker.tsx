import React from "react";
import { View, StyleSheet } from "react-native";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";

type TickerProps = {
  currencyId: string;
};

export const Ticker: React.FC<TickerProps> = ({ currencyId }) => {
  const currency = getCryptoCurrencyById(currencyId);

  return (
    <View style={styles.container}>
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
});
