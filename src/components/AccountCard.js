// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";

import Card from "./Card";
import CurrencyIcon from "./CurrencyIcon";
import CurrencyUnitValue from "./CurrencyUnitValue";
import LText from "./LText";

import colors from "../colors";

type Props = {
  account: Account,
  onPress?: () => void,
  style?: any,
};

class AccountCard extends PureComponent<Props> {
  render() {
    const { onPress, account, style } = this.props;
    return (
      <Card onPress={onPress} style={[styles.card, style]}>
        <CurrencyIcon size={24} currency={account.currency} />
        <View style={styles.accountName}>
          <LText
            semiBold
            numberOfLines={1}
            style={styles.accountNameText}
            ellipsizeMode="tail"
          >
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
    paddingVertical: 18,
    alignItems: "center",
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
    fontSize: 14,
    color: colors.grey,
  },
});

export default AccountCard;
