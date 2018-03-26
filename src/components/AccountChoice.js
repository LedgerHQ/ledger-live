/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import LText from "./LText";
import Touchable from "./Touchable";
import CurrencyIcon from "./CurrencyIcon";
import CurrencyUnitValue from "./CurrencyUnitValue";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
    marginVertical: 4,
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#ccc",
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  body: {
    paddingVertical: 8
  },
  currencyUnitText: {
    fontSize: 28
  }
});

export default class AccountChoice extends PureComponent<{
  onPress: Account => ?Promise<*>,
  account: Account
}> {
  onPress = () => {
    const { onPress, account } = this.props;
    return onPress(account);
  };
  render() {
    const { account } = this.props;
    return (
      <Touchable onPress={this.onPress}>
        <View style={styles.root}>
          <View style={styles.header}>
            <CurrencyIcon size={32} currency={account.currency} />
            <View style={styles.headerContent}>
              <LText bold>{account.name}</LText>
              <LText style={{ opacity: 0.5 }}>{account.currency.name}</LText>
            </View>
          </View>
          <View style={styles.body}>
            <CurrencyUnitValue
              ltextProps={{
                semiBold: true,
                style: styles.currencyUnitText
              }}
              unit={account.unit}
              value={account.balance}
              showCode
            />
          </View>
        </View>
      </Touchable>
    );
  }
}
