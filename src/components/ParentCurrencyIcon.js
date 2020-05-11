// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import colors from "../colors";
import CurrencyIcon from "./CurrencyIcon";

type Props = {
  currency: *,
  size: number,
};

export default class ParentCurrencyIcon extends PureComponent<Props> {
  render() {
    const { currency, size } = this.props;

    if (currency.type === "TokenCurrency") {
      return (
        <View style={{ width: size }}>
          <View style={styles.parentIconWrapper}>
            <CurrencyIcon size={size} currency={currency.parentCurrency} />
          </View>
          <View style={styles.tokenIconWrapper}>
            <CurrencyIcon size={size - 2} currency={currency} />
          </View>
        </View>
      );
    }

    return <CurrencyIcon size={size} currency={currency} />;
  }
}

const styles = StyleSheet.create({
  tokenIconWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    marginLeft: 0,
    marginTop: -6,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  parentIconWrapper: {
    marginLeft: -5,
  },
});
