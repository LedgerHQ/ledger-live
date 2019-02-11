// @flow

import { StyleSheet } from "react-native";
import React, { PureComponent } from "react";
import { RectButton } from "react-native-gesture-handler";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";

import LText from "./LText";
import CurrencyIcon from "./CurrencyIcon";

type Props = {
  currency: CryptoCurrency,
  onPress: CryptoCurrency => void,
  style?: *,
};

class CurrencyRow extends PureComponent<Props> {
  onPress = () => {
    this.props.onPress(this.props.currency);
  };

  render() {
    const { currency, style } = this.props;
    return (
      <RectButton style={[styles.root, style]} onPress={this.onPress}>
        <CurrencyIcon size={20} currency={currency} />
        <LText semiBold style={styles.name}>
          {currency.name}
        </LText>
      </RectButton>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  name: {
    marginLeft: 10,
    fontSize: 14,
  },
});

export default CurrencyRow;
