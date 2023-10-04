// @flow
import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import type { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import VotesField from "../fields/VotesField";
import PRInfoPopover from "../Info/Body/PRInfoPopover";

export default function StepVote({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  bridgePending,
  t,
}: StepProps) {
  invariant(account && transaction && transaction.votes, "account and transaction required");
  console.log("iconResourcesaaaa");
  const { iconResources } = account;
  console.log("iconResources", iconResources);
  const bridge = getAccountBridge(account, parentAccount);
  let validators = transaction.votes;
  if (transaction.votes.length === 0) {
    const mergedVotes = [...iconResources.votes, ...transaction.votes];
    const aggregate = {};
    mergedVotes.forEach(item => {
      if (aggregate[item.address]) {
        aggregate[item.address].value = Number(aggregate[item.address].value) + Number(item.value);
      } else {
        aggregate[item.address] = item;
      }
    });
    validators = Object.values(aggregate);
  }
  const updateVote = useCallback(
    updater => {
      onUpdateTransaction(transaction =>
        bridge.updateTransaction(transaction, { votes: updater(validators) }),
      );
    },
    [bridge, onUpdateTransaction],
  );

  return (
    <Box flow={1}>
      <TrackPage category="Vote Flow" name="Step 1" />
      <VotesField
        account={account}
        votes={validators}
        bridgePending={bridgePending}
        onChangeVotes={updateVote}
        status={status}
        t={t}
      />
    </Box>
  );
}

export function StepVoteFooter({
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
      <PRInfoPopover color="palette.primary.main" />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button disabled={!canNext} primary onClick={() => transitionTo("connectDevice")}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
