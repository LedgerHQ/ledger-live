import React, { PureComponent } from "react";
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

export class StepSummaryFooter extends PureComponent<StepProps> {
  state = {
    transactionHasBeenValidated: false,
  };

  onNext = async () => {
    const { transitionTo } = this.props;
    transitionTo("device");
  };

  componentDidMount() {
    const { account, parentAccount, transactionHash } = this.props;
    if (!account || !transactionHash) return;
    const mainAccount = getMainAccount(account, parentAccount);
    if (mainAccount.currency.family !== "ethereum") return;
    apiForCurrency(mainAccount.currency)
      .getTransactionByHash(transactionHash)
      .then((tx: { confirmations?: number }) => {
        if (tx.confirmations) {
          this.setState({ transactionHasBeenValidated: true });
        }
      });
  }

  render() {
    const { account, status, bridgePending } = this.props;
    if (!account) return null;
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
    const canNext = !bridgePending && !errorCount && !this.state.transactionHasBeenValidated;
    return (
      <>
        {this.state.transactionHasBeenValidated ? (
          <ErrorBanner error={new TransactionHasBeenValidatedError()} />
        ) : null}
        <Button
          id={"send-summary-continue-button"}
          primary
          disabled={!canNext}
          onClick={this.onNext}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </>
    );
  }
}
