import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
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
import type { StepProps } from "../../neuronFlow/types";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "neutral.c100",
}))<{ shouldSpace?: boolean }>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;

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

  if (optimisticOperation) {
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
        {signed ? (
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

export const StepConfirmationFooter = ({
  error,
  onClose,
  onRetry,
  optimisticOperation,
  transitionTo,
}: StepProps) => {
  const onRetryClick = useCallback(() => {
    onRetry();
    transitionTo("manageAction");
  }, [onRetry, transitionTo]);

  // Back to the list rather than closing: the point of the flow is managing several neurons.
  const onBackToList = useCallback(() => transitionTo("listNeuron"), [transitionTo]);

  return (
    <Box horizontal justifyContent="flex-end" width="100%">
      <Button onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {optimisticOperation ? (
        <Button primary ml={2} onClick={onBackToList} data-testid="icp-back-to-neurons-button">
          <Trans i18nKey="internetComputer.manageNeuronFlow.confirmation.backToNeurons" />
        </Button>
      ) : null}
      {error ? <RetryButton ml={2} primary onClick={onRetryClick} /> : null}
    </Box>
  );
};

export default StepConfirmation;
