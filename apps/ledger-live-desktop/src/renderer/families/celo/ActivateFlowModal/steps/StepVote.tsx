import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  activatableVotes,
  fallbackValidatorGroup,
} from "@ledgerhq/live-common/families/celo/logic";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import ActivateValidatorGroupRow from "~/renderer/families/celo/ActivateFlowModal/components/ActivateValidatorGroupRow";
import { StepProps } from "../types";
export const StepVoteFooter = ({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
}: StepProps) => {
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          isLoading={bridgePending}
          disabled={!canNext}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          <Trans i18nKey="common.continue" isLoading={bridgePending} />
        </Button>
      </Box>
    </>
  );
};
const StepVote = ({
  account,
  parentAccount,
  onChangeTransaction,
  transaction,
  error,
}: StepProps) => {
  invariant(
    account && transaction && account.celoResources && account.celoResources.votes,
    "account with votes and transaction required",
  );
  const bridge = getAccountBridge(account, parentAccount);
  const onChange = useCallback(
    (recipient: string) => {
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          recipient,
        }),
      );
    },
    [bridge, transaction, onChangeTransaction],
  );
  const votes = activatableVotes(account);
  if (!transaction.recipient && votes[0]) onChange(votes[0].validatorGroup);
  const { validatorGroups } = useCeloPreloadData();
  const mappedVotes = useMemo(
    () =>
      votes?.map(vote => ({
        vote,
        validatorGroup:
          validatorGroups.find(v => v.address === vote.validatorGroup) ||
          fallbackValidatorGroup(vote.validatorGroup),
      })) || [],
    [votes, validatorGroups],
  );
  const unit = getAccountUnit(account);
  return (
    <Box flow={1}>
      <TrackPage category="Celo Activate" name="Step 1" />
      {error ? <ErrorBanner error={error} /> : null}
      <Box vertical>
        {mappedVotes.map(({ vote, validatorGroup }) => {
          return (
            <ActivateValidatorGroupRow
              currency={account.currency}
              active={transaction.recipient === validatorGroup.address}
              onClick={() => onChange(validatorGroup.address)}
              key={validatorGroup.address}
              validatorGroup={validatorGroup}
              unit={unit}
              amount={vote.amount}
            ></ActivateValidatorGroupRow>
          );
        })}
      </Box>
    </Box>
  );
};
export default StepVote;
