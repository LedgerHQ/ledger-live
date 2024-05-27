import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction as CardanoTransaction } from "@ledgerhq/live-common/families/cardano/types";
import { StakePool } from "@ledgerhq/live-common/families/cardano/staking";
import ValidatorField from "../fields/ValidatorField";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import TranslatedError from "~/renderer/components/TranslatedError";
import Alert from "~/renderer/components/Alert";

export default function StepDelegation({
  account,
  onUpdateTransaction,
  transaction,
  status,
  error,
  t,
  setSelectedPool,
}: StepProps) {
  invariant(account, "account and transaction required");
  const { cardanoResources } = account;
  invariant(cardanoResources, "cardanoResources required");
  const delegation = cardanoResources.delegation;

  const { errors } = status;
  const displayError = errors.amount?.message ? errors.amount : "";

  const selectPool = (stakePool: StakePool) => {
    setSelectedPool(stakePool);
    const bridge: AccountBridge<CardanoTransaction> = getAccountBridge(account);
    onUpdateTransaction(() => {
      const updatedTransaction = bridge.updateTransaction(transaction as CardanoTransaction, {
        mode: "delegate",
        poolId: stakePool.poolId,
      });
      return updatedTransaction;
    });
  };

  const selectedPoolId = (transaction as CardanoTransaction).poolId;

  return (
    <Box flow={1}>
      <TrackPage category="Delegation Flow" name="Step Validator" />
      {error && <ErrorBanner error={error} />}
      <ValidatorField
        account={account}
        status={status}
        t={t}
        delegation={delegation}
        onChangeValidator={selectPool}
        selectedPoolId={selectedPoolId as string}
      />
      {displayError ? (
        <Alert type="error">
          <TranslatedError error={displayError} field="title" />
        </Alert>
      ) : null}
    </Box>
  );
}

export function StepDelegationFooter({
  transitionTo,
  account,
  status,
  bridgePending,
  transaction,
  onClose,
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const canNext = !bridgePending && !errors.amount && transaction;

  return (
    <Box horizontal justifyContent="flex-end" flow={2} grow>
      <AccountFooter account={account} status={status} />
      <Button mr={1} secondary onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        id="delegate-continue-button"
        disabled={!canNext}
        primary
        onClick={() => transitionTo("summary")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}
