// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";

import LText from "./LText";
import { rgba } from "../colors";

type Props = {
  currency: *,
  size: number,
  color?: string,
};

export default class CircleCurrencyIcon extends PureComponent<Props> {
  render() {
    const { size, currency, color } = this.props;
    const isToken = currency.type === "TokenCurrency";

    const backgroundColor =
      color || rgba(getCurrencyColor(currency), isToken ? 1 : 1);
    const ticker = isToken ? currency.ticker[0] : currency.ticker;
    const MaybeIconComponent = !isToken
      ? getCryptoCurrencyIcon(currency)
      : null;
    return (
      <View
        style={[styles.wrapper, { backgroundColor, width: size, height: size }]}
      >
        {MaybeIconComponent ? (
          <MaybeIconComponent size={size / 2} color="white" />
        ) : (
          <LText semiBold style={{ color: "white", fontSize: size / 2 }}>
            {ticker}
          </LText>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  tokenCurrencyIcon: {
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});
