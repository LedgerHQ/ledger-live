import React, { Fragment } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import SpendableBanner from "~/renderer/components/SpendableBanner";
import Alert from "~/renderer/components/Alert";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import AmountField from "~/renderer/modals/Send/fields/AmountField";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";

const StepAmount = ({
  t,
  account,
  transaction,
  onChangeTransaction,
  error,
  status,
  bridgePending,
}: StepProps) => {
  invariant(account, "account required");
  invariant(transaction?.family === "stacks", "stacks transaction required");

  return (
    <Box flow={4}>
      <CurrencyDownStatusAlert currencies={[account.currency]} />
      {error ? <ErrorBanner error={error} /> : null}
      <Fragment key={account.id}>
        <SpendableBanner account={account} transaction={transaction} />
        <AmountField
          account={account}
          transaction={transaction}
          onChangeTransaction={onChangeTransaction}
          status={status}
          bridgePending={bridgePending}
          t={t}
        />
        <Alert type="primary" small>
          <Trans i18nKey="stacks.stake.flow.steps.amount.disclaimer" />
        </Alert>
      </Fragment>
    </Box>
  );
};

export const StepAmountFooter = ({ account, status, bridgePending, transitionTo }: StepProps) => {
  if (!account) return null;
  const hasErrors = Object.keys(status.errors).length > 0;
  const canNext = !bridgePending && !hasErrors;
  return (
    <>
      <AccountFooter account={account} status={status} />
      <Button
        id="stacks-stake-amount-continue-button"
        isLoading={bridgePending}
        primary
        disabled={!canNext}
        onClick={() => transitionTo("connectDevice")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </>
  );
};

export default StepAmount;
