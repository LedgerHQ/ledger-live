// @flow
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import RevokeVoteRow from "../components/RevokeVoteRow";
import type { StepProps } from "../types";
import { useCeloPreloadData } from "@ledgerhq/live-common/lib/families/celo/react";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { revokableVotes } from "@ledgerhq/live-common/lib/families/celo/logic";
import Alert from "~/renderer/components/Alert";
import { urls } from "~/config/urls";

export default function StepVote({
  account,
  parentAccount,
  onChangeTransaction,
  transaction,
  error,
}: StepProps) {
  invariant(
    account && account.celoResources && transaction,
    "celo account, resources and transaction required",
  );

  const bridge = getAccountBridge(account, parentAccount);

  const onChange = useCallback(
    (recipient: string, index: number) => {
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          recipient,
          index,
        }),
      );
    },
    [bridge, transaction, onChangeTransaction],
  );

  const votes = revokableVotes(account);

  if (!transaction.recipient && votes[0]) onChange(votes[0].validatorGroup, votes[0].index);

  const { validatorGroups } = useCeloPreloadData();

  const mappedVotes = useMemo(
    () =>
      votes?.map(vote => ({
        vote,
        validatorGroup: validatorGroups.find(v => v.address === vote.validatorGroup),
      })) || [],
    [votes, validatorGroups],
  );

  const unit = getAccountUnit(account);

  return (
    <Box flow={1}>
      <TrackPage category="Withdraw Flow" name="Step 1" />
      {error ? <ErrorBanner error={error} /> : null}
      <Alert type="primary" mb={4} learnMoreUrl={urls.celo.revoking}>
        <Trans i18nKey="celo.revoke.steps.vote.info" />
      </Alert>
      <Box vertical>
        {mappedVotes.map(({ vote, validatorGroup }) => {
          const active =
            transaction.recipient === validatorGroup.address && transaction.index === vote.index;
          return (
            <RevokeVoteRow
              currency={account.currency}
              active={active}
              onClick={() => onChange(validatorGroup.address, vote.index)}
              key={validatorGroup.address + vote.index}
              validatorGroup={validatorGroup}
              unit={unit}
              amount={vote.amount}
              type={vote.type}
            ></RevokeVoteRow>
          );
        })}
      </Box>
    </Box>
  );
}

export function StepVoteFooter({
  transitionTo,
  account,
  onClose,
  bridgePending,
  transaction,
}: StepProps) {
  invariant(account, "account required");

  const canNext = !bridgePending && transaction.recipient && transaction.index != null;

  return (
    <>
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          id="vote-continue-button"
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
