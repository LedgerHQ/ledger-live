// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";

import Card from "../../components/Card";
import CurrencyIcon from "../../components/CurrencyIcon";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import LText from "../../components/LText";

import colors from "./../../colors";

type Props = {
  account: Account,
  onPress: () => void,
  style?: any,
};

class AccountCard extends PureComponent<Props> {
  render() {
    const { onPress, account, style } = this.props;
    return (
      <Card onPress={onPress} style={[styles.card, style]}>
        <CurrencyIcon size={24} currency={account.currency} />
        <View style={styles.accountName}>
          <LText semiBold numberOfLines={1} style={styles.accountNameText}>
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
        </View>
      </Card>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  accountName: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: 16,
  },
  accountNameText: {
    fontSize: 14,
    color: colors.darkBlue,
  },
  balanceContainer: {
    marginLeft: 16,
    alignItems: "flex-end",
  },
  balanceNumText: {
    fontSize: 12,
    color: colors.grey,
  },
});

export default AccountCard;
