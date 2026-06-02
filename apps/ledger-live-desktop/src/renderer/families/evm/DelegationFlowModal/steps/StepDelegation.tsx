import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
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
}: Readonly<StepProps>) {
  invariant(transaction, "transaction required");

  const bridge = useAccountBridge<GenericTransaction>(account, parentAccount);
  const updateValidator = useCallback(
    (address: string, valId?: string) => {
      onUpdateTransaction(_tx =>
        bridge.updateTransaction(transaction, {
          mode: "delegate",
          valAddress: address,
          valId,
        }),
      );
    },
    [bridge, onUpdateTransaction, transaction],
  );

  const chosenVoteAccAddr = transaction.valAddress || "";

  return (
    <Box flow={1}>
      <TrackPage
        category="Delegation Flow"
        name="Step Validator"
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
}: Readonly<StepProps>) {
  const { errors } = status;
  const canNext =
    !bridgePending &&
    !errors.valAddress &&
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
