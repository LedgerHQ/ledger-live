import { getEditTransactionPatch } from "@ledgerhq/coin-evm/editTransaction/index";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import React, { memo } from "react";
import { urls } from "~/config/urls";
import { SharedFooterContinueButton, SharedStepMethod } from "~/renderer/components/SpeedUpCancel";
import { useStepMethodContinue, useStepMethodSelection } from "~/renderer/hooks/useStepMethodLogic";
import { TransactionErrorBanner } from "../components/TransactionErrorBanner";
import { StepProps } from "../types";

const StepMethod = ({
  account,
  parentAccount,
  editType,
  haveFundToSpeedup,
  haveFundToCancel,
  isOldestEditableOperation,
  setEditType,
  t,
}: StepProps) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { canSpeedup, canCancel, handleSpeedupClick, handleCancelClick, handleLearnMoreClick } =
    useStepMethodSelection({
      haveFundToSpeedup,
      haveFundToCancel,
      isOldestEditableOperation,
      setEditType,
      learnMoreUrl: urls.editEvmTx.learnMore,
    });

  return (
    <SharedStepMethod
      editType={editType}
      haveFundToSpeedup={haveFundToSpeedup}
      isOldestEditableOperation={isOldestEditableOperation}
      canSpeedup={canSpeedup}
      canCancel={canCancel}
      ticker={mainAccount.currency.ticker}
      learnMoreLabel={t("operation.edit.learnMore")}
      onSpeedupClick={handleSpeedupClick}
      onCancelClick={handleCancelClick}
      onLearnMoreClick={handleLearnMoreClick}
    />
  );
};

export const StepMethodFooter: React.FC<StepProps> = ({
  editType,
  account,
  parentAccount,
  transactionToUpdate,
  transactionHasBeenValidated,
  haveFundToSpeedup,
  haveFundToCancel,
  isOldestEditableOperation,
  updateTransaction,
  transitionTo,
}: StepProps) => {
  const canSpeedup = haveFundToSpeedup && isOldestEditableOperation;
  const canCancel = haveFundToCancel;
  const handleContinueClick = useStepMethodContinue<EvmTransaction>({
    editType,
    account,
    parentAccount,
    transactionToUpdate,
    updateTransaction,
    transitionTo,
    getPatch: getEditTransactionPatch,
  });

  return (
    <>
      <TransactionErrorBanner transactionHasBeenValidated={transactionHasBeenValidated} />
      <SharedFooterContinueButton
        id={"send-recipient-continue-button"}
        disabled={transactionHasBeenValidated || (!canSpeedup && !canCancel)}
        onClick={handleContinueClick}
      />
    </>
  );
};

export default memo<StepProps>(StepMethod);
