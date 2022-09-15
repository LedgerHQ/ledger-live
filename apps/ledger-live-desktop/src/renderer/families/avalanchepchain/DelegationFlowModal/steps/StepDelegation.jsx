// @flow
import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import type { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import type { AccountBridge, Transaction } from "@ledgerhq/live-common/types";
import ValidatorField from "../fields/ValidatorField";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import LedgerByFigmentTC from "../components/LedgerByFigmentTCLink";
import { isDefaultValidatorNode } from "@ledgerhq/live-common/families/avalanchepchain/utils";

export default function StepDelegation({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  error,
  t,
}: StepProps) {
  invariant(
    account && account.avalanchePChainResources && transaction,
    "avalanche account and transaction required",
  );

  const { avalanchePChainResources } = account;
  const delegations = avalanchePChainResources.delegations || [];

  const updateValidator = ({ address, endTime }) => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(tx => {
      return bridge.updateTransaction(tx, {
        recipient: address,
        endTime: new BigNumber(endTime),
      });
    });
  };

  const chosenVoteAccAddr = transaction.recipient;

  return (
    <Box flow={1}>
      <TrackPage category="Delegation Flow" name="Step Validator" />
      {error && <ErrorBanner error={error} />}
      <ValidatorField
        account={account}
        status={status}
        t={t}
        delegations={delegations}
        onChangeValidator={updateValidator}
        chosenVoteAccAddr={chosenVoteAccAddr}
      />
    </Box>
  );
}

export function StepDelegationFooter({
  transitionTo,
  account,
  onClose,
  bridgePending,
  transaction,
}: StepProps) {
  invariant(account, "avalanche account required");

  const canNext = !bridgePending && transaction?.recipient;
  const displayTC = isDefaultValidatorNode(transaction.recipient);

  return (
    <>
      {displayTC && <LedgerByFigmentTC />}
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
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
