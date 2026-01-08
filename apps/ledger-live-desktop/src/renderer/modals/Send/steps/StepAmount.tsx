import React, { Fragment, PureComponent } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import SpendableBanner from "~/renderer/components/SpendableBanner";

import AccountFooter from "../AccountFooter";
import SendAmountFields from "../SendAmountFields";
import AmountField from "../fields/AmountField";
import { StepProps } from "../types";
import { closeAllModal } from "~/renderer/reducers/modals";
import { useDispatch } from "LLD/hooks/redux";
import LowGasAlertBuyMore from "~/renderer/components/LowGasAlertBuyMore";

const StepAmount = (props: StepProps) => {
  const dispatch = useDispatch();
  const {
    t,
    account,
    parentAccount,
    transaction,
    onChangeTransaction,
    error,
    status,
    bridgePending,
    maybeAmount,
    onResetMaybeAmount,
    updateTransaction,
    currencyName,
    walletConnectProxy,
  } = props;
  invariant(transaction, "transaction required");
  invariant(account, "account required");

  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "main account required");

  if (!status) return null;
  const { errors } = status;
  const { gasPrice } = errors;

  return (
    <Box flow={4}>
      <TrackPage
        category="Send Flow"
        name="Step Amount"
        currencyName={currencyName}
        walletConnectSend={walletConnectProxy}
      />
      <CurrencyDownStatusAlert currencies={[mainAccount.currency]} />
      {error ? <ErrorBanner error={error} /> : null}
      <Fragment key={account.id}>
        <SpendableBanner
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
        />

        <AmountField
          status={status}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          onChangeTransaction={onChangeTransaction}
          bridgePending={bridgePending}
          walletConnectProxy={walletConnectProxy}
          t={t}
          initValue={maybeAmount}
          resetInitValue={onResetMaybeAmount}
        />

        <SendAmountFields
          account={mainAccount}
          parentAccount={parentAccount}
          status={status}
          transaction={transaction}
          onChange={onChangeTransaction}
          bridgePending={bridgePending}
          updateTransaction={updateTransaction}
        />
        <LowGasAlertBuyMore
          account={mainAccount}
          handleRequestClose={() => dispatch(closeAllModal())}
          gasPriceError={gasPrice}
          trackingSource={"send flow"}
        />
      </Fragment>
    </Box>
  );
};
export class StepAmountFooter extends PureComponent<StepProps> {
  onNext = async () => {
    const { transitionTo } = this.props;
    transitionTo("summary");
  };

  render() {
    const { account, parentAccount, status, bridgePending } = this.props;
    const { errors } = status;
    if (!account) return null;
    const mainAccount = getMainAccount(account, parentAccount);
    const isTerminated = mainAccount.currency.terminated;
    const hasErrors = Object.keys(errors).length;
    const canNext = !bridgePending && !hasErrors && !isTerminated;

    return (
      <>
        <AccountFooter parentAccount={parentAccount} account={account} status={status} />

        <Button
          id={"send-amount-continue-button"}
          isLoading={bridgePending}
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

export default StepAmount;
