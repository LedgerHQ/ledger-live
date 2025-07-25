import { getMainAccount } from "@ledgerhq/live-common/account/index";
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
import Alert from "~/renderer/components/Alert";
import { APTOS_DELEGATION_RESERVE } from "@ledgerhq/live-common/families/aptos/constants";

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

  return (
    <Box flow={4}>
      <TrackPage
        category="Delegation Flow"
        name="Step Amount"
        flow="stake"
        action="staking"
        currency="aptos"
      />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {account && transaction && mainAccount && (
        <Fragment key={account.id}>
          {account && transaction ? (
            <SpendableBanner
              account={account}
              parentAccount={parentAccount}
              transaction={transaction}
            />
          ) : null}
          <AmountField
            status={status}
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            onChangeTransaction={onChangeTransaction}
            bridgePending={bridgePending}
            t={t}
          />
          <Alert type="warning" small>
            <Trans
              i18nKey="aptos.stake.reserveWarning"
              values={{
                amount: APTOS_DELEGATION_RESERVE,
              }}
            />
          </Alert>
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
