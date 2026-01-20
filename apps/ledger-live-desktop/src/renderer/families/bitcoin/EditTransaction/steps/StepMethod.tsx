import { getEditTransactionPatch } from "@ledgerhq/coin-bitcoin/editTransaction/index";
import { Transaction as BitcoinTransaction } from "@ledgerhq/coin-bitcoin/types";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { memo } from "react";
import { urls } from "~/config/urls";
import Button from "~/renderer/components/Button";
import { SharedStepMethod } from "~/renderer/components/SpeedUpCancel";
import { useStepMethodSelection } from "~/renderer/hooks/useStepMethodLogic";
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
      learnMoreUrl: urls.editBitcoinTx.learnMore,
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
  t,
  updateTransaction,
  transitionTo,
}: StepProps) => {
  const canSpeedup = haveFundToSpeedup && isOldestEditableOperation;
  const canCancel = haveFundToCancel;

  const handleContinueClick = async () => {
    invariant(editType, "editType required");

    const bridge: AccountBridge<BitcoinTransaction> = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);

    const patch = await getEditTransactionPatch({
      editType,
      transaction: transactionToUpdate,
      account: mainAccount,
    });

    updateTransaction(tx => bridge.updateTransaction(tx, patch));

    transitionTo("summary");
  };

  return (
    <>
      <TransactionErrorBanner transactionHasBeenValidated={transactionHasBeenValidated} />
      <Button
        id={"send-recipient-continue-button"}
        primary
        disabled={transactionHasBeenValidated || (!canSpeedup && !canCancel)}
        onClick={handleContinueClick}
      >
        {t("common.continue")}
      </Button>
    </>
  );
};

export default memo<StepProps>(StepMethod);
