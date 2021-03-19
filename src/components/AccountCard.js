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
import { getTagDerivationMode } from "@ledgerhq/live-common/lib/derivation";
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
  useFullBalance?: Boolean,
};

class AccountCard extends PureComponent<Props> {
  render() {
    const {
      onPress,
      account,
      style,
      disabled,
      colors,
      useFullBalance,
    } = this.props;
    const currency = getAccountCurrency(account);
    const unit = getAccountUnit(account);
    const tag =
      account.derivationMode !== undefined &&
      account.derivationMode !== null &&
      getTagDerivationMode(currency, account.derivationMode);

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
          {tag ? (
            <View style={[styles.badgeContainer, { borderColor: colors.grey }]}>
              <LText semiBold style={styles.badgeLabel} color="grey">
                {tag}
              </LText>
            </View>
          ) : null}
        </View>
        <View style={styles.balanceContainer}>
          <LText semiBold color="grey">
            <CurrencyUnitValue
              showCode
              unit={unit}
              value={
                useFullBalance
                  ? account.balance
                  : getAccountSpendableBalance(account)
              }
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 16,
  },
  badgeLabel: { fontSize: 7, textTransform: "uppercase" },
  accountNameText: {
    fontSize: 14,
    flexShrink: 1,
  },
  balanceContainer: {
    marginLeft: 16,
    alignItems: "flex-end",
  },
});

export default withTheme(AccountCard);
