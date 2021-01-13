/* @flow */
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import { useTheme } from "@react-navigation/native";
import SummaryRowCustom from "./SummaryRowCustom";
import Circle from "../../components/Circle";
import LText from "../../components/LText";
import CurrencyIcon from "../../components/CurrencyIcon";
import Wallet from "../../icons/Wallet";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};
function SummaryFromSection({ account }: Props) {
  const { colors } = useTheme();
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
          <LText numberOfLines={1} style={styles.summaryRowText}>
            {getAccountName(account)}
          </LText>
        </View>
      }
    />
  );
}
const styles = StyleSheet.create({
  summaryRowText: {
    fontSize: 16,
    textAlign: "right",
  },
  currencyIcon: {
    paddingRight: 8,
    justifyContent: "center",
  },
});

export default memo<Props>(SummaryFromSection);
