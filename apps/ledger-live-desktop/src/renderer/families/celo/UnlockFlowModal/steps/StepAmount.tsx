import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { urls } from "~/config/urls";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Alert from "~/renderer/components/Alert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AmountField from "../fields/AmountField";
import { StepProps } from "../types";
import NotEnoughFundsToUnstake from "~/renderer/components/NotEnoughFundsToUnstake";
import { NotEnoughBalance } from "@ledgerhq/errors";

export const StepAmountFooter = ({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
}: StepProps) => {
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          disabled={!canNext}
          isLoading={bridgePending}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          <Trans i18nKey="common.continue" isLoading={bridgePending} disabled={!canNext} />
        </Button>
      </Box>
    </>
  );
};
const StepAmount = ({
  account,
  parentAccount,
  onChangeTransaction,
  transaction,
  status,
  error,
  bridgePending,
  t,
  onClose,
}: StepProps) => {
  invariant(account && transaction, "account and transaction required");
  const notEnoughFundsError =
    status.errors.amount && status.errors.amount instanceof NotEnoughBalance;

  return (
    <Box flow={1}>
      <SyncSkipUnderPriority priority={100} />
      <TrackPage
        category="Celo Unlock"
        name="Step 1"
        flow="stake"
        action="unlock"
        currency="celo"
      />
      {error && <ErrorBanner error={error} />}
      {status.errors.sender && <ErrorBanner error={status.errors.sender} />}
      <Alert
        type="primary"
        learnMoreUrl={urls.celo.learnMore}
        learnMoreLabel={<Trans i18nKey="celo.unlock.steps.amount.learnMore" />}
        mb={4}
      >
        <Trans i18nKey="celo.unlock.steps.amount.info" />
      </Alert>
      <AmountField
        transaction={transaction}
        account={account}
        parentAccount={parentAccount}
        bridgePending={bridgePending}
        onChangeTransaction={onChangeTransaction}
        status={status}
        t={t}
      />
      <Box mb={3} />
      {notEnoughFundsError ? <NotEnoughFundsToUnstake account={account} onClose={onClose} /> : null}
    </Box>
  );
};
export default StepAmount;
