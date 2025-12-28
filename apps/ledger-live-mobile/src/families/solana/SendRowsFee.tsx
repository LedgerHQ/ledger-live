import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { TransactionStatus as SolanaTransactionStatus } from "@ledgerhq/live-common/families/solana/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Alert, Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { urls } from "~/utils/urls";
import ExternalLink from "~/icons/ExternalLink";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import { NavigatorName, ScreenName } from "~/const";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useNavigation } from "@react-navigation/core";
import TokenTransferFeesWarning from "./Token2022/TokenTransferFeesWarning";
import { TouchableOpacity } from "react-native";
import TranslatedError from "~/components/TranslatedError";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  status?: TransactionStatus;
};

export default function SolanaFeeRow({ account, parentAccount, status, transaction }: Props) {
  const { colors } = useTheme();
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.solana.supportPage);
  }, []);

  const navigation = useNavigation();
  const onBuy = useCallback(
    (account: Account) => {
      navigation.navigate(NavigatorName.Exchange, {
        screen: ScreenName.ExchangeBuy,
        params: {
          defaultAccountId: account.id,
          defaultCurrencyId: account.currency.id,
        },
      });
    },
    [navigation],
  );

  const mainAccount = getMainAccount(account, parentAccount);
  const fees = (status as SolanaTransactionStatus).estimatedFees;

  const isTokenAccount = account.type === "TokenAccount";
  const unit = useAccountUnit(isTokenAccount ? parentAccount || account : account);
  const currency = getAccountCurrency(account);

  const errors = status?.errors;
  const insufficientError = Object.values(errors || {})[0] || null;

  return (
    <>
      <SummaryRow
        onPress={extraInfoFees}
        title={<Trans i18nKey="send.fees.title" />}
        additionalInfo={
          <View>
            <ExternalLink size={12} color={colors.grey} />
          </View>
        }
      >
        <View style={{ alignItems: "flex-end" }}>
          <View style={styles.accountContainer}>
            <Text style={styles.valueText}>
              <CurrencyUnitValue unit={unit} value={fees} />
            </Text>
          </View>
          <Text style={styles.countervalue} color="grey">
            <CounterValue before="≈ " value={fees} currency={currency} />
          </Text>
        </View>
      </SummaryRow>
      {insufficientError && (
        <TouchableOpacity onPress={() => onBuy(mainAccount)}>
          <Alert type="warning">
            <Flex width={"90%"}>
              <Text testID="insufficient-fee-error">
                <TranslatedError error={insufficientError} />
              </Text>
            </Flex>
          </Alert>
        </TouchableOpacity>
      )}
      {isTokenAccount && (
        <TokenTransferFeesWarning tokenAccount={account} transaction={transaction} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  countervalue: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
  },
});
