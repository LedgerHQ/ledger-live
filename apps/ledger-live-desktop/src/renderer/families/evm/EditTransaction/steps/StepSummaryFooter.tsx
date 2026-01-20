import { getMainAccount } from "@ledgerhq/live-common/account/index";
import React from "react";
import { SharedStepSummaryFooter } from "~/renderer/components/SpeedUpCancel";
import { TransactionErrorBanner } from "../components/TransactionErrorBanner";
import { StepProps } from "../types";

export const StepSummaryFooter = ({
  account,
  parentAccount,
  transactionHasBeenValidated,
  status,
  bridgePending,
  transitionTo,
}: StepProps) => {
  const mainAccount = getMainAccount(account, parentAccount);
  if (mainAccount.currency.family !== "evm") {
    return null;
  }

  const onNext = async () => {
    transitionTo("device");
  };

  const { errors } = status;
  return (
    <SharedStepSummaryFooter
      transactionHasBeenValidated={transactionHasBeenValidated}
      bridgePending={bridgePending}
      errors={errors}
      onContinue={onNext}
      TransactionErrorBanner={TransactionErrorBanner}
    />
  );
};
