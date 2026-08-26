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
  // Started from the neuron list, which has no neuron selected and so no manage step to return to.
  list_neurons: "device",
};

/**
 * Errors that say the command did not take effect: the canister refused it, or the replica refused
 * the message before the canister saw it. Nothing ran, so re-signing repeats nothing.
 *
 * A subset of DELIVERED_ERRORS — an accepted call that went unanswered also reached the network, but
 * says nothing about whether it executed.
 */
const NOTHING_EXECUTED = new Set(["ICPGovernanceRejected", "ICPCallRejected"]);

/**
 * Commands a second execution leaves in the same state as the first, so re-signing one is safe even
 * when the first may already have run.
 *
 * The dissolve-delay commands are the counter-example and the reason this is a whitelist: both land
 * on the canister's `increase_dissolve_delay`, which *adds* to the delay the neuron already has, so
 * a second one that executes doubles the change. Split, spawn, disburse and stake_maturity each
 * move funds or mint a neuron, and are equally not repeatable.
 */
const IDEMPOTENT_COMMANDS = new Set<ICPTransactionType>([
  "list_neurons",
  "refresh_voting_power",
  "start_dissolving",
  "stop_dissolving",
  "add_hot_key",
  "remove_hot_key",
  "auto_stake_maturity",
  "follow",
]);

export const StepConfirmationFooter = ({
  error,
  onClose,
  resetAttempt,
  optimisticOperation,
  lastAction,
  signed,
  transitionTo,
}: StepProps) => {
  const retryStep = (lastAction && RETRY_STEP[lastAction]) ?? "manageAction";

  const onRetryClick = useCallback(() => {
    resetAttempt();
    transitionTo(retryStep);
  }, [resetAttempt, retryStep, transitionTo]);

  // Back to the list rather than closing: the point of the flow is managing several neurons. The
  // attempt is discarded on the way out, because both list steps render an error in place of the
  // list — leaving one set would send the user straight back to this failure.
  const onBackToList = useCallback(() => {
    resetAttempt();
    transitionTo("listNeuron");
  }, [resetAttempt, transitionTo]);

  const succeeded = !!optimisticOperation && !error;
  /*
   * Three ways a retry is safe: the signature never left the device, so nothing was sent; the network
   * answered that the command did not run; or running it twice makes no difference.
   *
   * Everything else is a request that may already be executing, and a retry cannot be a redelivery —
   * the expiry is minted when the call is built, so re-signing produces a new request id and the IC's
   * own de-duplication no longer covers it. Both copies can then take effect, which for an additive
   * command like increase_dissolve_delay means the change applies twice. Those send the user to the
   * list instead, where Refresh neurons establishes what actually happened.
   */
  const canRetry =
    !!error &&
    (!signed ||
      NOTHING_EXECUTED.has(error.name) ||
      (!!lastAction && IDEMPOTENT_COMMANDS.has(lastAction)));

  return (
    <Box horizontal justifyContent="flex-end" width="100%">
      <Button onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {/* Mirrors the body's branch, so a success action never sits beside Retry. */}
      {succeeded || (!!error && !canRetry) ? (
        <Button primary ml={2} onClick={onBackToList} data-testid="icp-back-to-neurons-button">
          <Trans i18nKey="internetComputer.manageNeuronFlow.confirmation.backToNeurons" />
        </Button>
      ) : null}
      {canRetry ? <RetryButton ml={2} primary onClick={onRetryClick} /> : null}
    </Box>
  );
};

export default StepConfirmation;
