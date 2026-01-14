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
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
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

function StepConfirmation({ optimisticOperation, error, signed }: StepProps) {
  const { t } = useTranslation();
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category="Sui Undelegate"
          name="Step Confirmation"
          flow="stake"
          action="undelegate"
          currency="sui"
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={t("sui.unstake.flow.steps.confirmation.success.title")}
          description={<div></div>}
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Sui Undelegate"
          name="Step Confirmation Error"
          flow="stake"
          action="undelegate"
          currency="sui"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={t("sui.unstake.flow.steps.confirmation.broadcastError")}
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
  const { t } = useTranslation();
  const concernedOperation = optimisticOperation
    ? optimisticOperation.subOperations && optimisticOperation.subOperations.length > 0
      ? optimisticOperation.subOperations[0]
      : optimisticOperation
    : null;

  const onViewDetails = useCallback(() => {
    onClose();
    if (account && concernedOperation) {
      setDrawer(OperationDetails, {
        operationId: concernedOperation.id,
        accountId: account.id,
      });
    }
  }, [onClose, account, concernedOperation]);
  return (
    <Box horizontal alignItems="right">
      <Button data-testid="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {concernedOperation && (
        <Button
          primary
          ml={2}
          event="Unstake Sui Flow Step 3 View OpD Clicked"
          onClick={onViewDetails}
        >
          {t("sui.unstake.flow.steps.confirmation.success.cta")}
        </Button>
      )}
      {!concernedOperation && error && <RetryButton primary ml={2} onClick={onRetry} />}
    </Box>
  );
}
export default StepConfirmation;
