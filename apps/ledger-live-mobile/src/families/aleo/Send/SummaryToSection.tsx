import React from "react";
import { StyleSheet, View } from "react-native";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { isSelfTransferTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useTheme } from "styled-components/native";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useMaybeAccountName } from "~/reducers/wallet";
import SummaryRowCustom from "~/screens/SendFunds/SummaryRowCustom";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import CurrencyIcon from "~/components/CurrencyIcon";
import QrCode from "@ledgerhq/icons-ui/native/QrCode";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  transaction: Transaction;
  currency: CryptoCurrency;
  badge?: React.ReactNode;
  account: AccountLike;
  parentAccount: Account | null | undefined;
}>;

export function SummaryToSection({ transaction, currency, badge, account, parentAccount }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const allAccounts = useSelector(flattenAccountsSelector);

  const accountCurrency = getAccountCurrency(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const isSelfTransfer = transaction.family === "aleo" && isSelfTransferTransaction(transaction);
  const isTokenAccount = account.type === "TokenAccount";

  const selfTransferAccount = isTokenAccount
    ? account
    : (allAccounts.find(
        a =>
          a.type === "Account" &&
          a.currency.id === currency.id &&
          a.freshAddress === transaction.recipient,
      ) ?? mainAccount);

  const recipientAccount = isSelfTransfer ? selfTransferAccount : undefined;
  const recipientAccountName = useMaybeAccountName(recipientAccount);

  return (
    <SummaryRowCustom
      label={t("send.summary.to")}
      labelBadge={badge}
      iconLeft={
        <Circle bg={colors.opacityDefault.c05} size={34}>
          <QrCode size="S" color={colors.primary.c80} />
        </Circle>
      }
      data={
        isSelfTransfer && recipientAccountName ? (
          <View style={styles.row}>
            <View style={styles.iconWrapper}>
              <CurrencyIcon size={14} currency={accountCurrency} />
            </View>
            <LText numberOfLines={1} style={styles.text}>
              {recipientAccountName}
            </LText>
          </View>
        ) : (
          <LText numberOfLines={2} style={styles.text}>
            {transaction.recipient}
          </LText>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  iconWrapper: {
    paddingRight: 8,
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
  },
});
