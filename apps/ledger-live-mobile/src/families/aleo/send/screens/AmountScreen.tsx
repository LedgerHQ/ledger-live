import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Alert } from "@ledgerhq/native-ui";
import type { Transaction } from "@ledgerhq/coin-aleo/types";
import { isPrivateTransaction } from "@ledgerhq/coin-aleo/logic/utils";
import { SendFlowLayout } from "~/mvvm/features/Send/components/SendFlowLayout";
import { AmountScreenInner } from "~/mvvm/features/Send/screens/Amount/components/AmountScreenInner";
import { useAmountScreen } from "~/mvvm/features/Send/screens/Amount/hooks/useAmountScreen";

export function AleoAmountScreen() {
  const { t } = useTranslation();
  const viewModel = useAmountScreen();

  if (!viewModel.ready) {
    return null;
  }

  const transaction = viewModel.transaction as Transaction;
  const isPrivate = isPrivateTransaction(transaction);

  return (
    <SendFlowLayout>
      {/* Info Banner for Private Transfers */}
      {isPrivate && (
        <Box px={4} mb={4}>
          <Alert type="info" title={t("aleo.send.recordPicker.placeholder")} />
        </Box>
      )}

      {/* Standard Amount Input */}
      <AmountScreenInner
        account={viewModel.account}
        parentAccount={viewModel.parentAccount}
        transaction={viewModel.transaction}
        status={viewModel.status}
        bridgePending={viewModel.bridgePending}
        bridgeError={viewModel.bridgeError}
        uiConfig={viewModel.uiConfig}
        transactionActions={viewModel.transactionActions}
        onReview={viewModel.onReview}
        onGetFunds={viewModel.onGetFunds}
        onSelectCoinControl={viewModel.onSelectCoinControl}
      />
    </SendFlowLayout>
  );
}
