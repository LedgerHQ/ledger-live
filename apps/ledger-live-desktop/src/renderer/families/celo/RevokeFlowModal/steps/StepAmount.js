// @flow
import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";

import { SyncSkipUnderPriority } from "@ledgerhq/live-common/lib/bridge/react";

import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";

import type { StepProps } from "../types";
import AmountField from "../fields/AmountField";

export default function StepAmount({
  account,
  parentAccount,
  onChangeTransaction,
  transaction,
  status,
  error,
  bridgePending,
  t,
}: StepProps) {
  if (!status) return null;
  invariant(account && transaction, "account and transaction required");

  return (
    <Box flow={1}>
      <SyncSkipUnderPriority priority={100} />
      {error && <ErrorBanner error={error} />}
      <AmountField
        transaction={transaction}
        account={account}
        parentAccount={parentAccount}
        bridgePending={bridgePending}
        onChangeTransaction={onChangeTransaction}
        status={status}
        t={t}
      />
    </Box>
  );
}

export function StepAmountFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
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
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
