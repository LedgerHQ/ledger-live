import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { StepProps } from "../types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { Transaction } from "@ledgerhq/live-common/families/aleo/types";

export default function StepWithdrawal({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  error,
  status,
}: StepProps) {
  invariant(account && transaction, "account and transaction required");
  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const withdrawal =
    (transaction as Extract<Transaction, { mode: "bond_public" }>).withdrawal || "";

  const setWithdrawal = (withdrawal: string) =>
    onUpdateTransaction(() =>
      bridge.updateTransaction(transaction, { withdrawal } as Partial<Transaction>),
    );

  const showWithdrawalError = withdrawal.length > 0 && status.errors.withdrawal;

  return (
    <Box flow={3}>
      <TrackPage category="Bond Flow" name="Step Withdrawal" currency="aleo" type="modal" />
      {error && withdrawal.length > 0 && <ErrorBanner error={error} />}
      <Alert type="warning" small>
        <Trans i18nKey="aleo.bond.flow.steps.withdrawal.info" />
      </Alert>
      <Box>
        <Label>
          <Trans i18nKey="aleo.bond.flow.steps.withdrawal.label" />
        </Label>
        <Input value={withdrawal} onChange={setWithdrawal} />
        {showWithdrawalError && <ErrorBanner error={status.errors.withdrawal} />}
      </Box>
    </Box>
  );
}

export function StepWithdrawalFooter({
  transitionTo,
  status,
  bridgePending,
  transaction,
  onClose,
}: StepProps) {
  const withdrawal =
    transaction && (transaction as Extract<Transaction, { mode: "bond_public" }>).withdrawal;
  const canNext = !bridgePending && !!withdrawal && !status.errors.withdrawal;

  return (
    <Box horizontal>
      <Button mr={1} onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        id="bond-withdrawal-continue-button"
        disabled={!canNext}
        primary
        onClick={() => transitionTo("amount")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}
