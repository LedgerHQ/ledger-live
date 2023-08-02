import { getTransactionByHash } from "@ledgerhq/coin-evm/api/transaction/index";
import { AmountRequired, TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { NotEnoughNftOwned, NotOwnedNft } from "@ledgerhq/live-common/errors";
import React, { useState } from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { StepProps } from "../types";

export const StepSummaryFooter = (props: StepProps) => {
  const { account, parentAccount, transactionHash, status, bridgePending, transitionTo } = props;
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
  // exclude "NotOwnedNft" and "NotEnoughNftOwned" error if it's a nft speedup operation
  let errorCount = Object.keys(errors).length;
  if (
    errors.amount &&
    ((errors.amount as Error) instanceof NotOwnedNft ||
      (errors.amount as Error) instanceof NotEnoughNftOwned ||
      (errors.amount as Error) instanceof AmountRequired)
  ) {
    errorCount = errorCount - 1;
  }

  const canNext = !bridgePending && !errorCount && !transactionHasBeenValidated;

  return (
    <>
      {transactionHasBeenValidated ? (
        <ErrorBanner error={new TransactionHasBeenValidatedError()} />
      ) : null}
      <Button id={"send-summary-continue-button"} primary disabled={!canNext} onClick={onNext}>
        <Trans i18nKey="common.continue" />
      </Button>
    </>
  );
};
