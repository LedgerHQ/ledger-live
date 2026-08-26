import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import type { ICPTransactionType } from "@ledgerhq/live-common/families/internet_computer/types";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import RetryButton from "~/renderer/components/RetryButton";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import type { StepId, StepProps } from "../../neuronFlow/types";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "neutral.c100",
}))<{ shouldSpace?: boolean }>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;

/**
 * Errors that already say what the network did with the request, so the "could not be sent"
 * disclaimer would contradict them: the first two were answered by the canister or the replica, and
 * the third reports an accepted call whose outcome is simply unknown.
 */
const DELIVERED_ERRORS = new Set([
  "ICPGovernanceRejected",
  "ICPCallRejected",
  "ICPCallUnconfirmed",
]);

/**
 * One confirmation screen for every neuron operation: which one ran is read from `lastAction`, so
 * the copy comes from a per-operation translation key rather than a screen per operation.
 */
const StepConfirmation = ({
  account,
  optimisticOperation,
  error,
  signed,
  lastAction,
}: StepProps) => {
  const { t } = useTranslation();

  // An attempt either broadcast or failed, never both. Requiring the absence of an error keeps a
  // stale success from outranking a live failure even if the two ever diverge again.
  if (optimisticOperation && !error) {
    return (
      <Container>
        <TrackPage
          category="Manage Neurons ICP Flow"
          name="Step Confirmed"
          flow="stake"
          action={lastAction ?? "manageNeuron"}
          currency={account.currency.id}
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={<Trans i18nKey="internetComputer.manageNeuronFlow.confirmation.success.title" />}
          description={t(
            `internetComputer.manageNeuronFlow.confirmation.success.${lastAction ?? "default"}`,
            t("internetComputer.manageNeuronFlow.confirmation.success.default"),
          )}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Manage Neurons ICP Flow"
          name="Step Confirmation Error"
          flow="stake"
          action={lastAction ?? "manageNeuron"}
          currency={account.currency.id}
        />
        {signed && !DELIVERED_ERRORS.has(error.name) ? (
          <BroadcastErrorDisclaimer
            title={
              <Trans i18nKey="internetComputer.manageNeuronFlow.confirmation.broadcastError" />
            }
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }

  return null;
};

/**
 * Where a retry belongs for each action: back at the step that collected its input, so a value the
 * user needs to change can be changed. Everything absent here took no input, and retries at the
 * device step — which both flows have, unlike the input steps.
 */
const RETRY_STEP: Partial<Record<ICPTransactionType, StepId>> = {
  set_dissolve_delay: "setDissolveDelay",
  increase_dissolve_delay: "setDissolveDelay",
  stake_maturity: "stakeMaturity",
  split_neuron: "splitNeuron",
  add_hot_key: "addHotKey",
  // Back to the followee list rather than the topic picker: the topic is already chosen and the list
  // it holds is what a retry is likely to be correcting.
  follow: "selectFollowees",
};

export const StepConfirmationFooter = ({
  error,
  onClose,
  resetAttempt,
  optimisticOperation,
  lastAction,
  transitionTo,
}: StepProps) => {
  const retryStep = (lastAction && RETRY_STEP[lastAction]) ?? "manageAction";

  const onRetryClick = useCallback(() => {
    resetAttempt();
    transitionTo(retryStep);
  }, [resetAttempt, retryStep, transitionTo]);

  // Back to the list rather than closing: the point of the flow is managing several neurons.
  const onBackToList = useCallback(() => transitionTo("listNeuron"), [transitionTo]);

  const succeeded = !!optimisticOperation && !error;
  // The call was accepted but never answered, so whether it ran is unknown and its own copy says to
  // sync before trying again. Re-signing the same transaction would contradict that — and for an
  // additive command like increase_dissolve_delay, a second one that lands applies twice. Send the
  // user to the list instead, which is where Refresh neurons is.
  const outcomeUnknown = error?.name === "ICPCallUnconfirmed";

  return (
    <Box horizontal justifyContent="flex-end" width="100%">
      <Button onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {/* Mirrors the body's branch, so a success action never sits beside Retry. */}
      {succeeded || outcomeUnknown ? (
        <Button primary ml={2} onClick={onBackToList} data-testid="icp-back-to-neurons-button">
          <Trans i18nKey="internetComputer.manageNeuronFlow.confirmation.backToNeurons" />
        </Button>
      ) : null}
      {error && !outcomeUnknown ? <RetryButton ml={2} primary onClick={onRetryClick} /> : null}
    </Box>
  );
};

export default StepConfirmation;
