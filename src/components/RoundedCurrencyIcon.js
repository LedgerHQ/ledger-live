// @flow

import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import colors, { rgba } from "../colors";
import Alert from "../icons/Alert";
import LiveLogo from "../icons/LiveLogoIcon";
import Circle from "./Circle";
import CurrencyIcon from "./CurrencyIcon";
import Rounded from "./Rounded";
import Spinning from "./Spinning";

export default class RoundedCurrencyIcon extends PureComponent<{
  currency: CryptoCurrency,
  size: number,
  extra?: "pending" | "done" | "notice" | "error",
}> {
  render() {
    const { currency, size, extra } = this.props;
    return (
      <Rounded bg={rgba(currency.color, 0.1)}>
        {extra ? (
          <View style={styles.statusWrapper}>
            {extra === "pending" ? (
              <Spinning>
                <LiveLogo color={colors.grey} size={16} />
              </Spinning>
            ) : extra === "done" ? (
              <Circle bg={colors.green} size={24}>
                <Icon name="check" size={16} color={colors.white} />
              </Circle>
            ) : extra === "notice" ? (
              <Circle bg={colors.live} size={24}>
                <Alert size={16} color={colors.white} />
              </Circle>
            ) : (
              <Circle bg={colors.alert} size={24}>
                <Alert size={16} color={colors.white} />
              </Circle>
            )}
          </View>
        ) : null}
        <CurrencyIcon currency={currency} size={size} />
      </Rounded>
    );
  }
}

const styles = StyleSheet.create({
  statusWrapper: {
    height: 32,
    width: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.white,
    position: "absolute",
    right: -8,
    top: -8,
    borderRadius: 24,
    backgroundColor: colors.white,
  },
});
