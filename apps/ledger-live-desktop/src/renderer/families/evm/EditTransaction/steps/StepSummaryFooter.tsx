import { getTransactionByHash } from "@ledgerhq/coin-evm/api/transaction/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import React, { useState } from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import { TransactionErrorBanner } from "../components/TransactionErrorBanner";
import { StepProps } from "../types";

export const StepSummaryFooter = ({
  account,
  parentAccount,
  transactionHash,
  status,
  bridgePending,
  transitionTo,
}: StepProps) => {
  const [transactionHasBeenValidated, setTransactionHasBeenValidated] = useState(false);

  if (!account || !transactionHash) {
    return null;
  }

  const mainAccount = getMainAccount(account, parentAccount);
  if (mainAccount.currency.family !== "evm") {
    return null;
  }

  const onNext = async () => {
    transitionTo("device");
  };

  getTransactionByHash(mainAccount.currency, transactionHash).then(tx => {
    if (tx?.confirmations) {
      setTransactionHasBeenValidated(true);
    }
  });

  const { errors } = status;
  const errorCount = Object.keys(errors).length;

  const canNext = !bridgePending && !errorCount && !transactionHasBeenValidated;

  return (
    <>
      <TransactionErrorBanner
        transactionHasBeenValidated={transactionHasBeenValidated}
        errors={errors}
      />
      <Button id={"send-summary-continue-button"} primary disabled={!canNext} onClick={onNext}>
        <Trans i18nKey="common.continue" />
      </Button>
    </>
  );
};
