// @flow
import {
  getAccountName,
  getAccountSpendableBalance,
} from "@ledgerhq/live-common/lib/account";
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
import { withTheme } from "../colors";

type Props = {
  account: AccountLike,
  onPress?: () => void,
  style?: any,
  disabled?: boolean,
  colors: *,
};

class AccountCard extends PureComponent<Props> {
  render() {
    const { onPress, account, style, disabled, colors } = this.props;
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
            color={disabled ? "grey" : "darkBlue"}
            style={[styles.accountNameText]}
          >
            {getAccountName(account)}
          </LText>
        </View>
        <View style={styles.balanceContainer}>
          <LText semiBold color="grey">
            <CurrencyUnitValue
              showCode
              unit={unit}
              value={getAccountSpendableBalance(account)}
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
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "transparent",
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
});

export default withTheme(AccountCard);
