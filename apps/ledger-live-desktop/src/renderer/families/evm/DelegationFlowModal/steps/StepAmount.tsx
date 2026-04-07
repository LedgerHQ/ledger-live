import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import React, { Fragment, PureComponent } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import SpendableBanner from "~/renderer/components/SpendableBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import AmountField from "~/renderer/modals/Send/fields/AmountField";
import { StepProps } from "../types";

const StepAmount = ({
  t,
  account,
  parentAccount,
  transaction,
  onChangeTransaction,
  error,
  status,
  bridgePending,
}: StepProps) => {
  if (!status) return null;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  // GenericTransaction is not in the generated Transaction union — cast at the boundary
  const tx = transaction as unknown as Transaction;
  return (
    <Box flow={4}>
      <TrackPage
        category="Delegation EVM"
        name="Step Amount"
        flow="stake"
        action="delegation"
        currency={account.currency.id}
      />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {account && tx && mainAccount && (
        <Fragment key={account.id}>
          {account && tx ? (
            <SpendableBanner account={account} parentAccount={parentAccount} transaction={tx} />
          ) : null}
          <AmountField
            status={status as never}
            account={account}
            parentAccount={parentAccount}
            transaction={tx}
            onChangeTransaction={onChangeTransaction as never}
            bridgePending={bridgePending}
            t={t}
            withUseMaxLabel={true}
          />
        </Fragment>
      )}
    </Box>
  );
};

export class StepAmountFooter extends PureComponent<StepProps> {
  onNext = async () => {
    const { transitionTo } = this.props;
    transitionTo("connectDevice");
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
        <AccountFooter parentAccount={parentAccount} account={account} status={status as never} />
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
