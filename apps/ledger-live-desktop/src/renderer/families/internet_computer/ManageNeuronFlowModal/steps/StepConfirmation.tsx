import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { canRetryNeuronCommand } from "@ledgerhq/live-common/families/internet_computer/neuron";
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
 * the last two report an accepted call that went unanswered.
 */
const DELIVERED_ERRORS = new Set([
  "ICPGovernanceRejected",
  "ICPCallRejected",
  "ICPCallUnconfirmed",
  "ICPNeuronsNotRead",
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

export const StepConfirmationFooter = ({
  error,
  onClose,
  resetAttempt,
  optimisticOperation,
  lastAction,
  signed,
  transitionTo,
  onUpdateTransaction,
}: StepProps) => {
  const retryStep = (lastAction && RETRY_STEP[lastAction]) ?? "manageAction";

  const onRetryClick = useCallback(() => {
    resetAttempt();
    // A new object: the bridge re-checks only a transaction it has not seen.
    onUpdateTransaction(tx => ({ ...tx }));
    transitionTo(retryStep);
  }, [onUpdateTransaction, resetAttempt, retryStep, transitionTo]);

  // Back to the list rather than closing: the point of the flow is managing several neurons. The
  // attempt is discarded on the way out, because both list steps render an error in place of the
  // list — leaving one set would send the user straight back to this failure.
  const onBackToList = useCallback(() => {
    resetAttempt();
    transitionTo("listNeuron");
  }, [resetAttempt, transitionTo]);

  const succeeded = !!optimisticOperation && !error;
  const canRetry =
    !!error && canRetryNeuronCommand({ signed, errorName: error.name, command: lastAction });

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
