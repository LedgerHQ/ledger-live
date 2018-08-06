// @flow
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import LText from "../../components/LText";
import Card from "../../components/Card";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import CurrencyIcon from "../../components/CurrencyIcon";
import colors from "../../colors";

type Props = {
  account: Account,
  onPress: void => void,
  style: any,
};

class AccountCard extends Component<Props> {
  render() {
    const { account, onPress, style } = this.props;
    return (
      <Card onPress={onPress} style={[styles.root, style]}>
        <CurrencyIcon size={24} currency={account.currency} />
        <View style={styles.accountName}>
          <LText semiBold numberOfLines={2} style={styles.accountNameText}>
            {account.name}
          </LText>
        </View>
        <View style={styles.balanceContainer}>
          <LText tertiary style={styles.balanceNumText}>
            <CurrencyUnitValue
              showCode
              unit={account.unit}
              value={account.balance}
            />
          </LText>
          <View style={styles.balanceCounterContainer}>
            <LText tertiary>
              <CounterValue
                showCode
                currency={account.currency}
                value={account.balance}
              />
            </LText>
          </View>
        </View>
      </Card>
    );
  }
}

export default AccountCard;

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "center",
    height: 72,
  },
  accountName: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: 16,
  },
  accountNameText: {
    color: colors.dark,
  },
  balanceContainer: {
    marginLeft: 16,
    alignItems: "flex-end",
  },
  balanceNumText: {
    fontSize: 16,
    color: colors.dark,
  },
  balanceCounterContainer: {
    marginTop: 5,
  },
});
