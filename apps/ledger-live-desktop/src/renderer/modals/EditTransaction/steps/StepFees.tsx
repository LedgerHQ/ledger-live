import React, { Fragment, PureComponent, memo } from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Alert from "~/renderer/components/Alert";
import SendAmountFields from "../../Send/SendAmountFields";
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
        <div>{`${t("operation.edit.previousFeesInfo")} ${feeValue} ${
          mainAccount.currency.ticker
        }`}</div>
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
