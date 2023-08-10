import React, { useState } from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";
import { apiForCurrency } from "@ledgerhq/live-common/families/ethereum/api/index";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import { NotOwnedNft as Erc721NotOwnedNft } from "@ledgerhq/live-common/families/ethereum/modules/erc721";
import {
  NotOwnedNft as Erc1155NotOwnedNft,
  NotEnoughNftOwned as Erc1155NotEnoughNftOwned,
} from "@ledgerhq/live-common/families/ethereum/modules/erc1155";

export const StepSummaryFooter: React.FC<StepProps> = props => {
  const [transactionHasBeenValidated, setTransactionHasBeenValidated] = useState(false);

  const { account, parentAccount, transactionHash, status, bridgePending, transitionTo } = props;

  const onNext = async () => {
    transitionTo("device");
  };

  if (!account || !transactionHash) {
    return null;
  }

  const mainAccount = getMainAccount(account, parentAccount);
  if (mainAccount.currency.family !== "ethereum") {
    return null;
  }

  apiForCurrency(mainAccount.currency)
    .getTransactionByHash(transactionHash)
    .then(tx => {
      if (tx?.confirmations) {
        setTransactionHasBeenValidated(true);
      }
    });

  if (!account) {
    return null;
  }

  const { errors } = status;
  // exclude "NotOwnedNft" and "NotEnoughNftOwned" error if it's a nft speedup operation
  let errorCount = Object.keys(errors).length;
  if (
    errors.amount &&
    ((errors.amount as Error) instanceof Erc721NotOwnedNft ||
      (errors.amount as Error) instanceof Erc1155NotOwnedNft ||
      (errors.amount as Error) instanceof Erc1155NotEnoughNftOwned)
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
