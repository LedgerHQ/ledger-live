import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";
import { apiForCurrency } from "@ledgerhq/live-common/families/ethereum/api/index";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";

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
    const canNext =
      !bridgePending && !Object.keys(errors).length && !this.state.transactionHasBeenValidated;
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
