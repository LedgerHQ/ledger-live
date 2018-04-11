/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import { getBalanceHistory } from "@ledgerhq/wallet-common/lib/helpers/account";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import BalanceChartMiniature from "../../components/BalanceChartMiniature";

class AccountHeader extends PureComponent<{
  account: Account
}> {
  render() {
    const { account } = this.props;
    const balanceHistory = getBalanceHistory(account, 10);
    return (
      <View style={styles.header}>
        <LText bold style={styles.amount}>
          <CurrencyUnitValue unit={account.unit} value={account.balance} />
        </LText>
        <LText numberOfLines={1} style={styles.headerText}>
          {account.name}
        </LText>
        <BalanceChartMiniature
          width={100}
          height={60}
          data={balanceHistory}
          color="white"
        />
      </View>
    );
  }
}

export default AccountHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 10,
    flex: 1
  },
  amount: {
    fontSize: 14,
    color: "white"
  },
  headerText: {
    color: "white",
    fontSize: 14,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 5
  }
});
