import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import RevokeVoteRow from "../components/RevokeVoteRow";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import { revokableVotes, fallbackValidatorGroup } from "@ledgerhq/live-common/families/celo/logic";
import Alert from "~/renderer/components/Alert";
import { urls } from "~/config/urls";
import * as S from "./StepVote.styles";
import { StepProps } from "../types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
export const StepVoteFooter = ({
  transitionTo,
  account,
  onClose,
  bridgePending,
  transaction,
  status,
}: StepProps) => {
  invariant(account, "account required");
  const canNext =
    !bridgePending && transaction?.recipient && transaction?.index != null && !status.errors.sender;
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
          isLoading={bridgePending}
          onClick={() => transitionTo("amount")}
        >
          <Trans i18nKey="common.continue" isLoading={bridgePending} disabled={!canNext} />
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
  status,
}: StepProps) => {
  invariant(
    account && account.celoResources && transaction,
    "celo account, resources and transaction required",
  );
  const unit = useAccountUnit(account);
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
        validatorGroup:
          validatorGroups.find(v => v.address === vote.validatorGroup) ||
          fallbackValidatorGroup(vote.validatorGroup),
      })) || [],
    [votes, validatorGroups],
  );

  return (
    <Box flow={1}>
      <TrackPage
        category="Celo Revoke"
        name="Step 1"
        flow="stake"
        action="revoke"
        currency="celo"
      />
      {error ? <ErrorBanner error={error} /> : null}
      {status.errors.sender && <ErrorBanner error={status.errors.sender} />}
      <Alert type="primary" mb={4} learnMoreUrl={urls.celo.learnMore}>
        <Trans i18nKey="celo.revoke.steps.vote.info" />
      </Alert>
      <S.ValidatorsFieldContainer scroll>
        <Box p={1}>
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
      </S.ValidatorsFieldContainer>
    </Box>
  );
};
export default StepVote;
