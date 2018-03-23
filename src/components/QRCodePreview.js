/* @flow */
import React, { Component } from "react";
import invariant from "invariant";
import { View, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { encodeURIScheme } from "@ledgerhq/currencies";
import type { Currency } from "@ledgerhq/currencies";

export default class QRCodePreview extends Component<{
  address: string,
  size: number,
  currency?: Currency,
  amount?: number,
  useURIScheme?: boolean
}> {
  static defaultProps = {
    size: 200,
    useURIScheme: false
  };
  render() {
    const { useURIScheme, address, currency, amount, size } = this.props;
    let value;
    if (useURIScheme) {
      invariant(currency, "when using URI scheme, currency is required");
      value = encodeURIScheme({ address, currency, amount });
    } else {
      value = address;
    }
    return (
      <View style={styles.root}>
        <QRCode
          size={size}
          value={value}
          logo={require("../images/qrledger.jpg")}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "white",
    padding: 15,
    margin: 20,
    alignSelf: "center"
  }
});
