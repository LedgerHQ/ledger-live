import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StepProps } from "../types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { Transaction } from "@ledgerhq/live-common/families/polkadot/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ValidatorsField from "../fields/ValidatorsField";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
function StepNominationContent({
  account,
  onUpdateTransaction,
  transaction,
  status,
  bridgePending,
  error,
  openModal,
  onClose,
  t,
}: StepProps & { transaction: Transaction }) {
  const bridge = useAccountBridge<Transaction>(account);
  const onGoToChill = useCallback(() => {
    onClose();
    openModal("MODAL_POLKADOT_SIMPLE_OPERATION", {
      account,
      mode: "chill",
    });
  }, [onClose, openModal, account]);
  const updateNomination = useCallback(
    (updater: (a: string[]) => string[]) => {
      onUpdateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          validators: updater(transaction.validators || []),
        }),
      );
    },
    [bridge, onUpdateTransaction],
  );
  const { polkadotResources } = account;
  const nominations = polkadotResources.nominations || [];
  return (
    <Box flow={1}>
      <TrackPage
        category="Nomination Flow"
        name="Step 1"
        flow="stake"
        action="nomination"
        currency="dot"
      />
      {error && <ErrorBanner error={error} />}
      <ValidatorsField
        account={account}
        validators={transaction.validators || []}
        nominations={nominations}
        bridgePending={bridgePending}
        onChangeNominations={updateNomination}
        status={status}
        t={t}
        onGoToChill={onGoToChill}
      />
    </Box>
  );
}

export default function StepNomination(props: StepProps) {
  if (!props.account || !props.transaction) return null;
  return <StepNominationContent {...props} transaction={props.transaction} />;
}
export function StepNominationFooter({
  transitionTo,
  account,
  onClose,
  status,
  bridgePending,
}: StepProps) {
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  if (!account) return null;
  return (
    <>
      <AccountFooter account={account} status={status} />
      <Box horizontal>
        <Button mr={1} onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          id="nominate-continue-button"
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
