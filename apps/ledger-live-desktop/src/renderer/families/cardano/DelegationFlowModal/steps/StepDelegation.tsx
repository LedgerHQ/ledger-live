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
import { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";
import ValidatorField from "../fields/ValidatorField";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";

export default function StepDelegation({
  account,
  parentAccount,
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
  const selectPool = (stakePool: StakePool) => {
    setSelectedPool(stakePool);
    const bridge: AccountBridge<CardanoTransaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(tx => {
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
  invariant(account, "account required");
  const { errors } = status;
  const canNext = !bridgePending && !errors.validators && transaction;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
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
    </>
  );
}
