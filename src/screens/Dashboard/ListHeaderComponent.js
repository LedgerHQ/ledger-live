/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import type { Unit, BalanceHistory } from "@ledgerhq/wallet-common/lib/types";
import LText from "../../components/LText";
import DeltaChange from "../../components/DeltaChange";
import BalanceChart from "../../components/BalanceChart";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";

class ListHeaderComponent extends PureComponent<{
  globalBalanceHistory: BalanceHistory,
  totalBalance: number,
  totalBalancePeriodBegin: number,
  fiatUnit: Unit
}> {
  render() {
    const {
      globalBalanceHistory,
      totalBalance,
      totalBalancePeriodBegin,
      fiatUnit
    } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <LText semiBold style={styles.balanceText}>
              <CurrencyUnitValue
                unit={fiatUnit}
                value={this.props.totalBalance}
              />
            </LText>
            <DeltaChange
              before={totalBalancePeriodBegin}
              after={totalBalance}
            />
          </View>
        </View>
        <BalanceChart
          width={Dimensions.get("window").width}
          height={250}
          data={globalBalanceHistory}
          unit={fiatUnit}
        />
      </View>
    );
  }
}

export default ListHeaderComponent;

const styles = StyleSheet.create({
  root: {
    padding: 0,
    height: 300,
    backgroundColor: "white"
  },
  header: {
    padding: 10,
    flexDirection: "row"
  },
  balanceText: {
    fontSize: 24
  }
});
