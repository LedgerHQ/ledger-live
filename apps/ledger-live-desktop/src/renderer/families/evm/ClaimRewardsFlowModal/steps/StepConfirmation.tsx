import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { isStakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import invariant from "invariant";
import { useSelector } from "LLD/hooks/redux";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import RetryButton from "~/renderer/components/RetryButton";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";
import { StepProps } from "../types";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "neutral.c100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;

function StepConfirmation({ account, optimisticOperation, error, signed, transaction }: StepProps) {
  invariant(isStakingAccount(account), "account must have delegations");
  invariant(transaction && transaction.valAddress, "transaction and validator set is required");

  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  if (optimisticOperation) {
    const delegation = account.stakingResources.delegations.find(
      ({ validatorAddress }) => validatorAddress === transaction.valAddress,
    );
    const validator = account.stakingResources.validators?.find(
      ({ validatorAddress }) => validatorAddress === transaction.valAddress,
    );
    const amount =
      unit &&
      delegation &&
      formatCurrencyUnit(unit, delegation.pendingRewards, {
        showCode: true,
        locale,
      });
    return (
      <Container>
        <TrackPage
          category="ClaimRewards EVM Flow"
          name="Step Confirmed"
          flow="stake"
          action="claim_rewards"
          currency={account.currency.id}
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={<Trans i18nKey={`cosmos.claimRewards.flow.steps.confirmation.success.title`} />}
          description={
            <div>
              <Trans
                i18nKey={`cosmos.claimRewards.flow.steps.confirmation.success.text`}
                values={{
                  amount,
                  validator: validator && validator.name,
                }}
              >
                <b></b>
              </Trans>
            </div>
          }
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="ClaimRewards EVM Flow"
          name="Step Confirmation Error"
          flow="stake"
          action="claim_rewards"
          currency={account.currency.id}
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="cosmos.claimRewards.flow.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }
  return null;
}
export function StepConfirmationFooter({
  account,
  onRetry,
  error,
  onClose,
  optimisticOperation,
}: StepProps) {
  const concernedOperation = optimisticOperation
    ? optimisticOperation.subOperations && optimisticOperation.subOperations.length > 0
      ? optimisticOperation.subOperations[0]
      : optimisticOperation
    : null;
  return (
    <Box horizontal alignItems="right">
      <Button ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {concernedOperation ? (
        // FIXME make a standalone component!
        <Button
          primary
          ml={2}
          event="ClaimRewards EVM Flow Step 3 View OpD Clicked"
          onClick={() => {
            onClose();
            if (account && concernedOperation) {
              setDrawer(OperationDetails, {
                operationId: concernedOperation.id,
                accountId: account.id,
              });
            }
          }}
        >
          <Trans i18nKey="cosmos.claimRewards.flow.steps.confirmation.success.cta" />
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
}
export default StepConfirmation;
