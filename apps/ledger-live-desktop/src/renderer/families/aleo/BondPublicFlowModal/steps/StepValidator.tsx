import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { StepProps } from "../types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { Transaction, AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import ValidatorPicker from "../ValidatorPicker";

export default function StepValidator({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  error,
  status,
}: StepProps) {
  invariant(account && transaction, "account and transaction required");
  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const [attempt, setAttempt] = useState(0);

  // Aleo allows one validator per address, so an account with an open position can only
  // top that validator up. Body.tsx has already seeded `recipient` with it.
  const lockedTo = (account as AleoAccount).aleoResources?.bondedValidator ?? null;

  const onSelect = useCallback(
    (address: string) =>
      onUpdateTransaction(() => bridge.updateTransaction(transaction, { recipient: address })),
    [bridge, onUpdateTransaction, transaction],
  );

  return (
    <Box flow={3}>
      <TrackPage
        category="Bond Flow"
        name={lockedTo ? "Step Validator Locked" : "Step Validator"}
        currency="aleo"
        type="modal"
      />
      {error && <ErrorBanner error={error} />}
      {status.errors.recipient && <ErrorBanner error={status.errors.recipient} />}
      {lockedTo && (
        <Alert type="primary" small>
          <Trans i18nKey="aleo.bond.flow.steps.validator.topUpOnly" />
        </Alert>
      )}
      <ValidatorPicker
        key={attempt}
        currency={account.currency}
        selected={transaction.recipient || ""}
        lockedTo={lockedTo}
        onSelect={onSelect}
        onRetry={() => setAttempt(n => n + 1)}
      />
    </Box>
  );
}

export function StepValidatorFooter({
  transitionTo,
  status,
  bridgePending,
  transaction,
  onClose,
}: StepProps) {
  const canNext = !bridgePending && !!transaction?.recipient && !status.errors.recipient;
  return (
    <Box horizontal>
      <Button mr={1} onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        id="bond-continue-button"
        disabled={!canNext}
        primary
        onClick={() => transitionTo("amount")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}
