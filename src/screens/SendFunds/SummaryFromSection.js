/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import SummaryRowCustom from "./SummaryRowCustom";
import Circle from "../../components/Circle";
import LText from "../../components/LText";
import CurrencyIcon from "../../components/CurrencyIcon";
import Wallet from "../../icons/Wallet";

import colors from "../../colors";

type Props = {
  account: Account | TokenAccount,
  parentAccount: ?Account,
};
export default class SummaryFromSection extends PureComponent<Props> {
  render() {
    const { account } = this.props;
    const currency = getAccountCurrency(account);
    return (
      <SummaryRowCustom
        label={<Trans i18nKey="send.summary.from" />}
        iconLeft={
          <Circle bg={colors.lightLive} size={34}>
            <Wallet size={16} color={colors.live} />
          </Circle>
        }
        data={
          <View style={{ flexDirection: "row" }}>
            <View style={styles.currencyIcon}>
              <CurrencyIcon size={14} currency={currency} />
            </View>
            <LText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.summaryRowText}
            >
              {account.type === "Account" ? account.name : currency.name}
            </LText>
          </View>
        }
      />
    );
  }
}
const styles = StyleSheet.create({
  summaryRowText: {
    fontSize: 16,
    textAlign: "right",
    color: colors.darkBlue,
  },
  currencyIcon: {
    paddingRight: 8,
    justifyContent: "center",
  },
});
