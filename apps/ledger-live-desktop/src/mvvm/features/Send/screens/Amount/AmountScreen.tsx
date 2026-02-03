import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import { useSendFlowActions, useSendFlowData } from "../../context/SendFlowContext";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { AmountScreenInner } from "./components/AmountScreenInner";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";

export function AmountScreen() {
  const { state, uiConfig } = useSendFlowData();
  const { transaction: transactionActions, close } = useSendFlowActions();
  const { navigation } = useFlowWizard();
  const navigate = useNavigate();

  const { account, parentAccount } = state.account;
  const { bridgePending, bridgeError, status, transaction } = state.transaction;

  const handleGetFunds = useCallback(() => {
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount ?? undefined);
    const currencyId = "currency" in mainAccount ? mainAccount.currency.id : undefined;

    // Navigate to exchange (Buy) page with preselected currency (same behavior as Buy button)
    navigate("/exchange", {
      state: {
        currency: currencyId,
        account: mainAccount.id,
        mode: "buy",
      },
    });
    // Close the send flow dialog
    close();
  }, [account, close, navigate, parentAccount]);

  if (!account || !transaction || !status) {
    return null;
  }

  return (
    <AmountScreenInner
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      status={status}
      bridgePending={bridgePending}
      bridgeError={bridgeError}
      uiConfig={uiConfig}
      transactionActions={transactionActions}
      onReview={() => navigation.goToNextStep()}
      onGetFunds={handleGetFunds}
    />
  );
}
