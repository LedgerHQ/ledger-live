import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ValidatorsField from "../fields/ValidatorsField";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
export default function StepNomination({
  account,
  onUpdateTransaction,
  transaction,
  status,
  bridgePending,
  error,
  openModal,
  onClose,
  t,
}: StepProps) {
  const bridge = account && getAccountBridge(account);
  const onGoToChill = useCallback(() => {
    onClose();
    openModal("MODAL_POLKADOT_SIMPLE_OPERATION", {
      account,
      mode: "chill",
    });
  }, [onClose, openModal, account]);
  const updateNomination = useCallback(
    updater => {
      onUpdateTransaction(transaction =>
        bridge?.updateTransaction(transaction, {
          validators: updater(transaction.validators || []),
        }),
      );
    },
    [bridge, onUpdateTransaction],
  );
  if (!account || !transaction) return null;
  const { polkadotResources } = account;
  const nominations = polkadotResources.nominations || [];
  return (
    <Box flow={1}>
      <TrackPage category="Nomination Flow" name="Step 1" />
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
        <Button mr={1} secondary onClick={onClose}>
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
