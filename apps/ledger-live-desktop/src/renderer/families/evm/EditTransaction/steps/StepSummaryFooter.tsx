import React, { useState } from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";
import { apiForCurrency } from "@ledgerhq/live-common/families/ethereum/api/index";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import { NotEnoughNftOwned, NotOwnedNft } from "@ledgerhq/live-common/errors";

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

  apiForCurrency(mainAccount.currency)
    .getTransactionByHash(transactionHash)
    .then(tx => {
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
      (errors.amount as Error) instanceof NotEnoughNftOwned)
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
