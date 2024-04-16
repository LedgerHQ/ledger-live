import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency, getAccountName } from "@ledgerhq/live-common/account/index";
import { useTheme } from "styled-components/native";
import SummaryRowCustom from "./SummaryRowCustom";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import CurrencyIcon from "~/components/CurrencyIcon";
import Wallet from "@ledgerhq/icons-ui/native/Wallet";

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
};

function SummaryFromSection({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currency = getAccountCurrency(account);
  return (
    <SummaryRowCustom
      label={t("send.summary.from")}
      iconLeft={
        <Circle bg={colors.palette.opacityDefault.c05} size={34}>
          <Wallet size="S" color={colors.palette.primary.c80} />
        </Circle>
      }
      data={
        <View
          style={{
            flexDirection: "row",
          }}
        >
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
