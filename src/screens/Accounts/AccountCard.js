// @flow
import React, { PureComponent } from "react";
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
  style?: any,
  navigation: *,
};

class AccountCard extends PureComponent<Props> {
  onPress = () => {
    this.props.navigation.navigate("Account", {
      accountId: this.props.account.id,
    });
  };

  render() {
    const { account, style } = this.props;
    return (
      <Card onPress={this.onPress} style={[styles.root, style]}>
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
            <LText tertiary style={styles.balanceCounterText}>
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
    marginBottom: 10,
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
    color: colors.darkBlue,
  },
  balanceContainer: {
    marginLeft: 16,
    alignItems: "flex-end",
  },
  balanceNumText: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  balanceCounterContainer: {
    marginTop: 5,
  },
  balanceCounterText: {
    fontSize: 14,
    color: colors.smoke,
  },
});
