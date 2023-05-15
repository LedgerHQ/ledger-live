import React, { Fragment, PureComponent, memo } from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Alert from "~/renderer/components/Alert";
import SendAmountFields from "../../Send/SendAmountFields";
import logger from "~/renderer/logger";
import { StepProps } from "../types";
import { BigNumber } from "bignumber.js";
// eslint-disable-next-line no-restricted-imports
import { EIP1559ShouldBeUsed } from "@ledgerhq/live-common/families/ethereum/transaction";

const StepFees = (props: StepProps) => {
  const {
    t,
    account,
    parentAccount,
    transaction,
    onChangeTransaction,
    error,
    status,
    bridgePending,
    updateTransaction,
    transactionRaw,
  } = props;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const feePerGas = new BigNumber(
    EIP1559ShouldBeUsed(mainAccount.currency)
      ? transactionRaw.maxFeePerGas
      : transactionRaw.gasPrice,
  );
  const feeValue = new BigNumber(transactionRaw.userGasLimit || transactionRaw.estimatedGasLimit)
    .times(feePerGas)
    .div(new BigNumber(10).pow(mainAccount.unit.magnitude));
  // todo remove logger it after test
  logger.log(`transactionRaw.maxFeePerGas: ${transactionRaw.maxFeePerGas}`);
  logger.log(`transactionRaw.gasPrice: ${transactionRaw.gasPrice}`);
  logger.log(`transactionRaw.maxPriorityFeePerGas: ${transactionRaw.maxPriorityFeePerGas}`);

  let maxPriorityFeePerGasinGwei, maxFeePerGasinGwei, maxGasPriceinGwei;
  if (EIP1559ShouldBeUsed(mainAccount.currency)) {
    maxPriorityFeePerGasinGwei = new BigNumber(transactionRaw.maxPriorityFeePerGas)
      .dividedBy(1000000000)
      .toNumber();
    maxFeePerGasinGwei = new BigNumber(transactionRaw.maxFeePerGas)
      .dividedBy(1000000000)
      .toNumber();
  } else {
    maxGasPriceinGwei = new BigNumber(transactionRaw.gasPrice).dividedBy(1000000000).toNumber();
  }
  return (
    <Box flow={4}>
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {account && transaction && mainAccount && (
        <Fragment key={account.id}>
          <SendAmountFields
            account={mainAccount}
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
        {EIP1559ShouldBeUsed(mainAccount.currency) ? (
          <ul>
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
          <ul>
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
  onNext = async () => {
    const { transitionTo } = this.props;
    transitionTo("summary");
  };

  render() {
    const { bridgePending } = this.props;
    return (
      <>
        <Button
          id={"send-amount-continue-button"}
          isLoading={bridgePending}
          primary
          disabled={false}
          onClick={this.onNext}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </>
    );
  }
}

export default memo<StepProps>(StepFees);
