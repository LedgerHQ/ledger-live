// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";
import { getCurrencyColor } from "@ledgerhq/live-common/src/currencies";

import LText from "./LText";
import { rgba } from "../colors";

type Props = {
  currency: *,
  size: number,
  color?: string,
};

export default class CurrencyIcon extends PureComponent<Props> {
  render() {
    const { size, currency } = this.props;

    const color = getCurrencyColor(currency);

    if (currency.type === "TokenCurrency") {
      const dynamicStyle = {
        backgroundColor: rgba(color, 0.1),
        width: size,
        height: size,
      };

      return (
        <View style={[styles.tokenCurrencyIcon, dynamicStyle]}>
          <LText semiBold style={{ color, fontSize: size / 2 }}>
            {currency.ticker[0]}
          </LText>
        </View>
      );
    }

    const IconComponent = getCryptoCurrencyIcon(currency);
    if (!IconComponent) {
      return (
        <View style={[styles.altRoot, { width: size, height: size }]}>
          <LText style={{ fontSize: Math.floor(size / 3) }}>
            {currency.ticker}
          </LText>
        </View>
      );
    }
    return <IconComponent size={size} color={color || currency.color} />;
  }
}

const styles = StyleSheet.create({
  altRoot: {
    alignItems: "center",
    justifyContent: "center",
  },
  tokenCurrencyIcon: {
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});
