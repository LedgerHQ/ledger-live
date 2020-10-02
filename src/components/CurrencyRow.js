// @flow

import { StyleSheet } from "react-native";
import React, { PureComponent } from "react";
import { RectButton } from "react-native-gesture-handler";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";

import LText from "./LText";
import CircleCurrencyIcon from "./CircleCurrencyIcon";
import colors from "../colors";

type Props = {
  currency: CryptoCurrency | TokenCurrency,
  onPress: (CryptoCurrency | TokenCurrency) => void,
  isOK?: boolean,
  style?: *,
};

class CurrencyRow extends PureComponent<Props> {
  onPress = () => {
    this.props.onPress(this.props.currency);
  };

  render() {
    const { currency, style, isOK = true } = this.props;

    return (
      <RectButton style={[styles.root, style]} onPress={this.onPress}>
        <CircleCurrencyIcon
          size={26}
          currency={currency}
          color={!isOK ? colors.lightFog : undefined}
        />
        <LText
          semiBold
          style={[styles.name, !isOK ? { color: colors.fog } : null]}
        >
          {`${currency.name} (${currency.ticker})`}
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
    color: "black",
  },
});

export default CurrencyRow;
