import React, { Fragment, PureComponent, memo } from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Alert from "~/renderer/components/Alert";
import TranslatedError from "~/renderer/components/TranslatedError";
import SendAmountFields from "../../../../modals/Send/SendAmountFields";
import { StepProps } from "../types";
import { BigNumber } from "bignumber.js";
import { EIP1559ShouldBeUsed } from "@ledgerhq/live-common/families/ethereum/transaction";
import { TransactionRaw as EthereumTransactionRaw } from "@ledgerhq/live-common/families/ethereum/types";
import { TransactionHasBeenValidatedError, NotEnoughGas } from "@ledgerhq/errors";
import { apiForCurrency } from "@ledgerhq/live-common/families/ethereum/api/index";
import logger from "~/renderer/logger";
import { NotOwnedNft as Erc721NotOwnedNft } from "@ledgerhq/live-common/families/ethereum/modules/erc721";
import {
  NotOwnedNft as Erc1155NotOwnedNft,
  NotEnoughNftOwned as Erc1155NotEnoughNftOwned,
} from "@ledgerhq/live-common/families/ethereum/modules/erc1155";

const StepFees = (props: StepProps) => {
  const {
    t,
    account,
    parentAccount,
    transaction,
    onChangeTransaction,
    status,
    bridgePending,
    updateTransaction,
  } = props;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  if (!mainAccount) return null;
  const transactionRaw = props.transactionRaw as EthereumTransactionRaw;
  const feePerGas = new BigNumber(
    EIP1559ShouldBeUsed(mainAccount.currency)
      ? transactionRaw?.maxFeePerGas ?? 0
      : transactionRaw?.gasPrice ?? 0,
  );
  const feeValue = new BigNumber(
    transactionRaw.userGasLimit || transactionRaw.estimatedGasLimit || 0,
  )
    .times(feePerGas)
    .div(new BigNumber(10).pow(mainAccount.unit.magnitude));
  // log fees info
  logger.log(`transactionRaw.maxFeePerGas: ${transactionRaw.maxFeePerGas}`);
  logger.log(`transactionRaw.gasPrice: ${transactionRaw.gasPrice}`);
  logger.log(`transactionRaw.maxPriorityFeePerGas: ${transactionRaw.maxPriorityFeePerGas}`);

  let maxPriorityFeePerGasinGwei, maxFeePerGasinGwei, maxGasPriceinGwei;
  if (EIP1559ShouldBeUsed(mainAccount.currency)) {
    // dividedBy 1000000000 to convert from wei to gwei
    maxPriorityFeePerGasinGwei = new BigNumber(transactionRaw?.maxPriorityFeePerGas ?? 0)
      .dividedBy(1000000000)
      .toFixed();
    maxFeePerGasinGwei = new BigNumber(transactionRaw?.maxFeePerGas ?? 0)
      .dividedBy(1000000000)
      .toFixed();
  } else {
    maxGasPriceinGwei = new BigNumber(transactionRaw?.gasPrice ?? 0)
      .dividedBy(1000000000)
      .toFixed();
  }
  return (
    <Box flow={4}>
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {account && transaction && mainAccount && (
        <Fragment key={account.id}>
          <SendAmountFields
            account={mainAccount}
            parentAccount={parentAccount}
            status={status}
            transaction={transaction}
            onChange={onChangeTransaction}
            bridgePending={bridgePending}
            updateTransaction={updateTransaction}
            transactionRaw={transactionRaw}
          />
        </Fragment>
      )}
      <Alert type="primary">
        {EIP1559ShouldBeUsed(mainAccount.currency) ? ( // Display the fees info of the pending transaction (network fee, maxPriorityFeePerGas, maxFeePerGas, maxGasPrice)
          <ul style={{ marginLeft: "5px" }}>
            {t("operation.edit.previousFeesInfo.pendingTransactionFeesInfo")}
            <li>{`${t("operation.edit.previousFeesInfo.networkfee")} ${feeValue} ${
              mainAccount.currency.ticker
            }`}</li>
            <li>{`${t(
              "operation.edit.previousFeesInfo.maxPriorityFee",
            )} ${maxPriorityFeePerGasinGwei} Gwei`}</li>
            <li>{`${t("operation.edit.previousFeesInfo.maxFee")} ${maxFeePerGasinGwei} Gwei`}</li>
          </ul>
        ) : (
          <ul style={{ marginLeft: "5px" }}>
            {t("operation.edit.previousFeesInfo.pendingTransactionFeesInfo")}
            <li>{`${t("operation.edit.previousFeesInfo.networkfee")} ${feeValue} ${
              mainAccount.currency.ticker
            }`}</li>
            <li>{`${t("operation.edit.previousFeesInfo.gasPrice")} ${maxGasPriceinGwei} Gwei`}</li>
          </ul>
        )}
      </Alert>
    </Box>
  );
};

export class StepFeesFooter extends PureComponent<StepProps> {
  state = {
    transactionHasBeenValidated: false,
  };

  onNext = async () => {
    const { transitionTo } = this.props;
    transitionTo("summary");
  };

  componentDidMount() {
    const { account, parentAccount, transaction, transactionHash } = this.props;
    if (!account || !transaction || !transactionHash) return;
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
    const { bridgePending, status } = this.props;
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
    return (
      <>
        {this.state.transactionHasBeenValidated ? (
          <ErrorBanner error={new TransactionHasBeenValidatedError()} />
        ) : errors.gasPrice && errors.gasPrice instanceof NotEnoughGas ? (
          <Box width={"70%"}>
            <Alert type={"error"} title={<TranslatedError error={errors.gasPrice} />} />
          </Box>
        ) : errorCount ? (
          <Box width={"70%"}>
            <Alert type={"error"} title={<TranslatedError error={Object.values(errors)[0]} />} />
          </Box>
        ) : null}
        <Button
          id={"send-amount-continue-button"}
          isLoading={bridgePending}
          primary
          disabled={this.state.transactionHasBeenValidated || bridgePending || errorCount}
          onClick={this.onNext}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </>
    );
  }
}

export default memo<StepProps>(StepFees);
