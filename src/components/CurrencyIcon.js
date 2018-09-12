// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import LText from "./LText";

type Props = {
  currency: Currency,
  size: number,
  color?: string,
};

export default class CurrencyIcon extends PureComponent<Props> {
  render() {
    const { size, currency, color } = this.props;
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
});
