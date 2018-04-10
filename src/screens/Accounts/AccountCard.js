/* @flow */
import React, { PureComponent } from "react";
import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Image
} from "react-native";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import { getBalanceHistory } from "@ledgerhq/wallet-common/lib/helpers/account";
import Touchable from "../../components/Touchable";
import BalanceChartMiniature from "../../components/BalanceChartMiniature";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CurrencyIcon from "../../components/CurrencyIcon";
import CounterValue from "../../components/CounterValue";
import DeltaChange from "../../components/DeltaChange";

export default class AccountCard extends PureComponent<{
  account: Account,
  index: number,
  onItemFullPress: (account: Account, index: number) => void,
  topLevelNavigation: *
}> {
  onPress = () => {
    const { account, index, onItemFullPress } = this.props;
    return onItemFullPress(account, index);
  };
  onGoAccountSettings = () => {
    const { account, topLevelNavigation } = this.props;
    topLevelNavigation.navigate({
      routeName: "AccountSettings",
      params: {
        accountId: account.id
      },
      key: "accountsettings"
    });
  };
  render() {
    const { account } = this.props;
    const data = getBalanceHistory(account, 10);
    const startPrice = data[0].value;
    const endPrice = data[data.length - 1].value;
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View style={styles.root}>
          <View style={styles.body}>
            <View style={styles.head}>
              <View style={styles.icon}>
                <CurrencyIcon currency={account.currency} size={32} />
              </View>

              <View style={styles.account}>
                <LText semiBold numberOfLines={1} style={styles.accountName}>
                  {account.name}
                </LText>
                <LText numberOfLines={1} style={styles.currencyName}>
                  {account.currency.name}
                </LText>
              </View>

              <Touchable onPress={this.onGoAccountSettings}>
                <Image
                  source={require("../../images/accountsettings.png")}
                  style={styles.accountsSettingsIcon}
                />
              </Touchable>
            </View>

            <View style={styles.operationsColumn}>
              <LText semiBold style={styles.accountCardUnit}>
                <CurrencyUnitValue
                  unit={account.unit}
                  value={account.balance}
                />
              </LText>
              <View style={styles.operationsCountervalue}>
                <LText style={styles.operationsSubText}>
                  <CounterValue
                    value={account.balance}
                    currency={account.currency}
                  />
                </LText>
                <DeltaChange
                  style={styles.deltaChange}
                  before={startPrice}
                  after={endPrice}
                />
              </View>
            </View>

            <BalanceChartMiniature
              width={260}
              height={90}
              data={data}
              color={account.currency.color}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    width: 280,
    height: 220,
    padding: 10,
    backgroundColor: "white"
  },
  body: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end"
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10
  },
  icon: {
    marginRight: 10
  },
  account: {
    flexDirection: "column",
    flex: 1
  },
  accountName: {
    fontSize: 14
  },
  currencyName: {
    fontSize: 12,
    color: "#999"
  },
  accountsSettingsIcon: {
    width: 30,
    height: 30
  },
  accountCardUnit: {
    alignSelf: "flex-start",
    fontSize: 22
  },
  operationsColumn: {
    flexDirection: "column",
    marginLeft: 4,
    flex: 1
  },
  deltaChange: {
    marginLeft: 5,
    fontSize: 12
  },
  operationsCountervalue: {
    flexDirection: "row"
  },
  operationsSubText: {
    fontSize: 12,
    color: "#999"
  }
});
