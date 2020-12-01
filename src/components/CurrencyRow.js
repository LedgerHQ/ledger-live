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
          numberOfLines={1}
        >
          {`${currency.name} (${currency.ticker})`}
        </LText>
        {currency.type === "TokenCurrency" && currency.parentCurrency ? (
          <LText semiBold style={styles.currencyLabel}>
            {currency.parentCurrency.name}
          </LText>
        ) : null}
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
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "black",
  },
  currencyLabel: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    textAlign: "right",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.grey,
    paddingHorizontal: 6,
    fontSize: 10,
    height: 24,
    lineHeight: 24,
    color: colors.grey,
    marginLeft: 12,
  },
});

export default CurrencyRow;
