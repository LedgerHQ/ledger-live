// @flow

import React, { Fragment, PureComponent, useCallback } from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";

import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import SpendableBanner from "~/renderer/components/SpendableBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import AmountField from "~/renderer/modals/Send/fields/AmountField";

import type { Transaction } from "@ledgerhq/types-live";
import type { StepProps } from "../types";

const StepAmount = (props: StepProps) => {
  const {
    t,
    account,
    parentAccount,
    transaction,
    onChangeTransaction,
    error,
    status,
    bridgePending,
  } = props;

  if (!status) return null;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;

  const onUpdateTransactionCallback = useCallback(
    (transaction: Transaction) =>
      onChangeTransaction({
        ...transaction,
        mode: "delegate",
      }),
    [onChangeTransaction],
  );

  return (
    <Box flow={4}>
      <TrackPage category="Delegation Elrond" name="Step Amount" />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error ? <ErrorBanner error={error} /> : null}

      {account && transaction && mainAccount && (
        <Fragment key={account.id}>
          {account && transaction ? (
            <SpendableBanner {...{ account, transaction, parentAccount }} />
          ) : null}

          <AmountField
            {...{
              status,
              account,
              transaction,
              t,
              bridgePending,
              parentAccount,
              onChangeTransaction: onUpdateTransactionCallback,
            }}
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
      <Fragment>
        <AccountFooter {...{ account, status, parentAccount }} />

        <Button
          id="send-amount-continue-button"
          isLoading={bridgePending}
          primary={true}
          disabled={!canNext}
          onClick={this.onNext}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Fragment>
    );
  }
}

export default StepAmount;
