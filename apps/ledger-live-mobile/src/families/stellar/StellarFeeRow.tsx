import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useEffect } from "react";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { View, StyleSheet, Linking, TouchableOpacity, SafeAreaView } from "react-native";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import LText from "~/components/LText";
import CheckBox from "~/components/CheckBox";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import SectionSeparator from "~/components/SectionSeparator";
import ExternalLink from "~/icons/ExternalLink";
import { urls } from "~/utils/urls";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";

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
  const [customSelected, setCustomSelected] = useState<boolean | null>(null);
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);

  const bridge = getAccountBridge(account, parentAccount);
  const mainAccount = getMainAccount(account, parentAccount);
  const unit = useMaybeAccountUnit(mainAccount);
  const fees = transaction.family === "stellar" ? transaction.fees : null;
  const [estimatedFees, setEstimatedFees] = useState(fees || null);

  useEffect(() => {
    if (transaction.family === "stellar" && unit) {
      const fetchEstimatedFees = async () => {
        const preparedTransaction = await bridge.prepareTransaction(account as Account, {
          ...transaction,
          customFees: { parameters: { fees: null } },
        });
        setEstimatedFees(preparedTransaction.fees);
      };

      fetchEstimatedFees();
    }
  }, [bridge, transaction, account, mainAccount, unit]);

  if (transaction.family !== "stellar" || !unit) return null;
  const isCustomFee = fees && estimatedFees ? !fees.eq(estimatedFees) : false;
  const isCustom = customSelected ?? isCustomFee;

  const currency = getAccountCurrency(account);

  const onFeeModeChange = (selectCustom: boolean) => {
    setCustomSelected(selectCustom);
    if (selectCustom) {
      navigation.navigate(ScreenName.StellarEditCustomFees, {
        ...route.params,
        accountId: account.id,
        transaction,
      });
    } else {
      setTransaction(
        bridge.updateTransaction(transaction, {
          fees: estimatedFees,
          customFees: { parameters: { fees: estimatedFees } },
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
          borderColor: isSelected ? colors.live : colors.background,
          backgroundColor: isSelected ? colors.lightLive : colors.lightFog,
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
                <CurrencyUnitValue unit={unit} value={fee} />
              </LText>
            ) : null}
          </View>
          <LText style={styles.countervalue} color="grey">
            {fee ? <CounterValue before="≈ " value={fee} currency={currency} /> : null}
          </LText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <SectionSeparator lineColor={colors.lightFog} />
      <SummaryRow
        onPress={extraInfoFees}
        title={<Trans i18nKey="send.fees.title" />}
        additionalInfo={
          <View>
            <ExternalLink size={12} color={colors.grey} />
          </View>
        }
      >
        {null}
      </SummaryRow>

      <SafeAreaView style={styles.feesPickerContainer}>
        <FeeItem
          label={<Trans i18nKey="stellar.suggested" />}
          isSelected={!isCustom}
          fee={estimatedFees}
          onSelect={() => onFeeModeChange(false)}
        />
        <FeeItem
          label={<Trans i18nKey="fees.speed.custom" />}
          isSelected={isCustom}
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
