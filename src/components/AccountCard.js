// @flow
import { getAccountName } from "@ledgerhq/live-common/lib/account";
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account/helpers";
import Card from "./Card";
import CurrencyIcon from "./CurrencyIcon";
import CurrencyUnitValue from "./CurrencyUnitValue";
import LText from "./LText";
import colors from "../colors";

type Props = {
  account: AccountLike,
  onPress?: () => void,
  style?: any,
  disabled?: boolean,
};

class AccountCard extends PureComponent<Props> {
  render() {
    const { onPress, account, style, disabled } = this.props;
    const currency = getAccountCurrency(account);
    const unit = getAccountUnit(account);
    return (
      <Card
        onPress={!disabled ? onPress : undefined}
        style={[styles.card, style]}
      >
        <CurrencyIcon
          color={disabled ? colors.grey : undefined}
          size={20}
          currency={currency}
        />
        <View style={styles.accountName}>
          <LText
            semiBold
            numberOfLines={1}
            style={[
              styles.accountNameText,
              { color: disabled ? colors.grey : colors.darkBlue },
            ]}
          >
            {getAccountName(account)}
          </LText>
        </View>
        <View style={styles.balanceContainer}>
          <LText tertiary style={styles.balanceNumText}>
            <CurrencyUnitValue showCode unit={unit} value={account.balance} />
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
    paddingVertical: 16,
    alignItems: "center",
  },
  accountName: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: 8,
  },
  accountNameText: {
    fontSize: 14,
  },
  balanceContainer: {
    marginLeft: 16,
    alignItems: "flex-end",
  },
  balanceNumText: {
    color: colors.grey,
  },
});

export default AccountCard;
