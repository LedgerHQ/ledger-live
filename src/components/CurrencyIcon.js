// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import {
  getCryptoCurrencyIcon,
  getTokenCurrencyIcon,
} from "@ledgerhq/live-common/lib/reactNative";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";

import LText from "./LText";
import { rgba } from "../colors";

type Props = {
  currency: *,
  size: number,
  color?: string,
  radius?: number,
  bg?: string,
};

export default class CurrencyIcon extends PureComponent<Props> {
  render() {
    const { size, currency, color, radius, bg } = this.props;

    const currencyColor = color || getCurrencyColor(currency);

    if (currency.type === "TokenCurrency") {
      const dynamicStyle = {
        backgroundColor: bg || rgba(currencyColor, 0.1),
        width: size,
        height: size,
      };
      const TokenIconCurrency =
        getTokenCurrencyIcon && getTokenCurrencyIcon(currency);

      return (
        <View
          style={[
            styles.tokenCurrencyIcon,
            dynamicStyle,
            radius ? { borderRadius: radius } : null,
          ]}
        >
          {TokenIconCurrency ? (
            <TokenIconCurrency
              size={size * 0.55}
              color={currencyColor || currency.color}
            />
          ) : (
            <LText
              semiBold
              style={{ color: currencyColor, fontSize: size / 2 }}
            >
              {currency.ticker[0]}
            </LText>
          )}
        </View>
      );
    }

    const IconComponent = getCryptoCurrencyIcon(currency);
    if (!IconComponent) {
      return (
        <View
          style={[
            styles.altRoot,
            { width: size, height: size },
            radius ? { borderRadius: radius } : null,
          ]}
        >
          <LText style={{ fontSize: Math.floor(size / 3) }}>
            {currency.ticker}
          </LText>
        </View>
      );
    }
    return (
      <IconComponent size={size} color={currencyColor || currency.color} />
    );
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
