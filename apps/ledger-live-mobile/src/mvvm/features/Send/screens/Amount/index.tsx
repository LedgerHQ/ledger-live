import React, { useCallback, useMemo } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { ScreenName } from "~/const";
import { SendFlowLayout } from "../../components/SendFlowLayout";
import { useSendFlowData, useSendFlowActions } from "../../context/SendFlowContext";
import { useAmountScreenViewModel } from "./useAmountScreenViewModel";
import { AmountScreenView } from "./AmountScreenView";
import type { SendFlowNavigationProp } from "../../types";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "~/context/Locale";

export function AmountScreen() {
  const navigation = useNavigation<SendFlowNavigationProp>();
  const { state, uiConfig } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const { t } = useTranslation();

  const styles = useStyleSheet(
    theme => ({
      headerContent: {
        alignItems: "center" as const,
      },
      availableText: {
        color: theme.colors.text.muted,
      },
    }),
    [],
  );

  const { account, parentAccount } = state.account;
  const { transaction: tx, status, bridgePending, bridgeError } = state.transaction;

  const viewModel = useAmountScreenViewModel({
    account: account!,
    parentAccount: parentAccount ?? null,
    transaction: tx!,
    status,
    bridgePending,
    bridgeError,
    uiConfig,
    onUpdateTransaction: transaction.updateTransaction,
  });

  const handleReview = useCallback(() => {
    if (viewModel.hasInsufficientFundsError) {
      // TODO: Navigate to Buy flow
      return;
    }
    navigation.navigate(ScreenName.SendFlowConfirmation);
  }, [navigation, viewModel.hasInsufficientFundsError]);

  const availableBalance = useMemo(() => {
    if (!account) return "";
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = spendable ?? account.balance ?? new BigNumber(0);
    const currency = "currency" in account ? account.currency : null;
    if (!currency) return "";
    
    return formatCurrencyUnit(currency.units[0], balance, {
      showCode: true,
      disableRounding: true,
    });
  }, [account]);

  const headerContent = useMemo(
    () => (
      <View style={styles.headerContent}>
        <Text typography="body2" style={styles.availableText}>
          {t("send.amount.available")} {availableBalance}
        </Text>
      </View>
    ),
    [availableBalance, styles, t],
  );

  if (!account || !tx || !status) {
    return null;
  }

  return (
    <SendFlowLayout headerContent={headerContent}>
      <AmountScreenView {...viewModel} onReview={handleReview} />
    </SendFlowLayout>
  );
}
