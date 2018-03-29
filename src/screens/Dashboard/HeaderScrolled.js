/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import type {
  Account,
  BalanceHistory,
  Unit
} from "@ledgerhq/wallet-common/lib/types";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import BalanceChartMiniature from "../../components/BalanceChartMiniature";
import DeltaChange from "../../components/DeltaChange";

class HeaderScrolled extends Component<
  {
    accounts: Account[],
    globalBalanceHistory: BalanceHistory,
    totalBalance: number,
    totalBalancePeriodBegin: number,
    fiatUnit: Unit
  },
  *
> {
  render() {
    const {
      accounts,
      globalBalanceHistory,
      totalBalancePeriodBegin,
      totalBalance,
      fiatUnit
    } = this.props;
    if (accounts.length === 0) return null;
    return (
      <View style={styles.header}>
        <View>
          <LText semiBold style={styles.balanceTextHeader}>
            <CurrencyUnitValue unit={fiatUnit} value={totalBalance} />
          </LText>
          <DeltaChange
            before={totalBalancePeriodBegin}
            after={totalBalance}
            style={{ color: "white" }}
          />
        </View>
        <BalanceChartMiniature
          width={100}
          height={60}
          data={globalBalanceHistory}
          color="white"
        />
      </View>
    );
  }
}

export default HeaderScrolled;

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    flexDirection: "row",
    paddingLeft: 10
  },
  balanceTextHeader: {
    color: "white",
    fontSize: 24
  }
});
