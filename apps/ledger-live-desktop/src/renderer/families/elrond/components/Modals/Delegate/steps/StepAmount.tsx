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
import { StepProps } from "../types";

const StepAmount = (props: StepProps) => {
  const { t, account, transaction, onChangeTransaction, error, status, bridgePending } = props;
  const mainAccount = account ? getMainAccount(account) : null;
  const onUpdateTransactionCallback = useCallback(
    transaction =>
      onChangeTransaction({
        ...transaction,
        mode: "delegate",
      }),
    [onChangeTransaction],
  );
  if (!status) return null;
  return (
    <Box flow={4}>
      <TrackPage category="Delegation Elrond" name="Step Amount" />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error ? <ErrorBanner error={error} /> : null}

      {account && transaction && mainAccount && (
        <Fragment key={account.id}>
          {account && transaction ? (
            <SpendableBanner account={account} transaction={transaction} />
          ) : null}

          <AmountField
            status={status}
            account={account}
            transaction={transaction}
            t={t}
            bridgePending={bridgePending}
            onChangeTransaction={onUpdateTransactionCallback}
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
    const { account, status, bridgePending } = this.props;
    const { errors } = status;
    if (!account) return null;
    const mainAccount = getMainAccount(account);
    const isTerminated = mainAccount.currency.terminated;
    const hasErrors = Object.keys(errors).length;
    const canNext = !bridgePending && !hasErrors && !isTerminated;
    return (
      <Fragment>
        <AccountFooter account={account} status={status} />

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
