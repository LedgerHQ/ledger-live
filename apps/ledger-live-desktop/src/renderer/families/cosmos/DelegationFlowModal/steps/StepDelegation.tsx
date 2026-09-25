import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import ValidatorField from "../fields/ValidatorField";
import { StepProps } from "../types";

export default function StepDelegation({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  error,
  t,
}: StepProps) {
  invariant(transaction, "transaction required");
  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const updateValidator = useCallback(
    ({ address }: { address: string }) => {
      onUpdateTransaction(_tx => {
        return bridge.updateTransaction(transaction, {
          mode: "delegate",
          valAddress: address,
        });
      });
    },
    [bridge, onUpdateTransaction, transaction],
  );
  const chosenVoteAccAddr = transaction.valAddress || "";

  return (
    <Box flow={1}>
      <TrackPage
        category="Delegation Flow"
        name="Step Starter"
        page="Step Validator"
        flow="stake"
        action="delegation"
        currency={account.currency.id}
        type="modal"
      />
      {error && <ErrorBanner error={error} />}
      {status.errors.sender && <ErrorBanner error={status.errors.sender} />}
      <ValidatorField
        account={account}
        status={status}
        t={t}
        onChangeValidator={updateValidator}
        chosenVoteAccAddr={chosenVoteAccAddr}
      />
    </Box>
  );
}
export function StepDelegationFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
  const { errors } = status;
  const canNext =
    !bridgePending &&
    !errors.validators &&
    transaction &&
    !!transaction.valAddress &&
    !errors.sender;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          id="delegate-continue-button"
          disabled={!canNext}
          primary
          onClick={() => transitionTo("amount")}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
