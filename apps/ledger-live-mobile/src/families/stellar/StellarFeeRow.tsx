import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { View, StyleSheet, Linking, TouchableOpacity, SafeAreaView } from "react-native";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { CompositeScreenProps } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import CheckBox from "../../components/CheckBox";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import SectionSeparator from "../../components/SectionSeparator";
import ExternalLink from "../../icons/ExternalLink";
import { urls } from "@utils/urls";
import { ScreenName } from "../../const";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";

type Props = {
  account: AccountLike;
  transaction: Transaction;
  parentAccount?: Account | null;
  setTransaction: (..._: Array<Transaction>) => void;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function StellarFeeRow({
  account,
  parentAccount,
  transaction,
  navigation,
  route,
  setTransaction,
}: Props) {
  const { colors } = useTheme();
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);
  if (transaction.family !== "stellar") return null;
  const bridge = getAccountBridge(account, parentAccount);
  const suggestedFee = transaction.networkInfo?.fees;
  const fees = transaction.fees;
  const isCustomFee = fees && suggestedFee ? !fees.eq(suggestedFee) : false;
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getAccountCurrency(account);

  const onFeeModeChange = (isCustom: boolean) => {
    if (isCustom) {
      navigation.navigate(ScreenName.StellarEditCustomFees, {
        ...route.params,
        accountId: account.id,
        transaction,
      });
    } else {
      setTransaction(
        bridge.updateTransaction(transaction, {
          fees: suggestedFee,
        }),
      );
    }
  };

  const FeeItem = ({
    label,
    isSelected,
    fee,
    onSelect,
  }: {
    label: React.ReactNode;
    isSelected: boolean;
    fee?: BigNumber | null;
    onSelect: () => void;
  }) => (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        styles.feeButton,
        {
          borderColor: isSelected ? colors.primary.c80 : colors.background.main,
          backgroundColor: isSelected ? colors.opacityPurple.c10 : colors.neutral.c20,
        },
      ]}
    >
      <View style={[styles.feeContainer]}>
        <View style={styles.leftBox}>
          <CheckBox isChecked={isSelected} />
          <LText semiBold style={styles.feeLabel}>
            {label}
          </LText>
        </View>
        <View style={styles.feesAmountContainer}>
          <View style={styles.accountContainer}>
            {fee ? (
              <LText style={styles.valueText}>
                <CurrencyUnitValue unit={mainAccount.unit} value={fee} />
              </LText>
            ) : null}
          </View>
          <LText style={styles.countervalue} color="neutral.c70">
            {fee ? <CounterValue before="≈ " value={fee} currency={currency} /> : null}
          </LText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <SectionSeparator lineColor={colors.neutral.c20} />
      <SummaryRow
        onPress={extraInfoFees}
        title={<Trans i18nKey="send.fees.title" />}
        additionalInfo={
          <View>
            <ExternalLink size={12} color={colors.neutral.c70} />
          </View>
        }
      >
        {null}
      </SummaryRow>

      <SafeAreaView style={styles.feesPickerContainer}>
        <FeeItem
          label={<Trans i18nKey="stellar.suggested" />}
          isSelected={!isCustomFee}
          fee={suggestedFee}
          onSelect={() => onFeeModeChange(false)}
        />
        <FeeItem
          label={<Trans i18nKey="fees.speed.custom" />}
          isSelected={isCustomFee}
          fee={isCustomFee ? fees : null}
          onSelect={() => onFeeModeChange(true)}
        />
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  feesPickerContainer: {
    flex: 1,
    marginBottom: 16,
  },
  feesAmountContainer: {
    alignItems: "flex-end",
  },
  countervalue: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
  },
  feeButton: {
    width: "100%",
    borderRadius: 4,
    borderWidth: 1,
    marginVertical: 4,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  feeContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  feeLabel: {
    fontSize: 16,
    textTransform: "capitalize",
    marginLeft: 10,
  },
});
