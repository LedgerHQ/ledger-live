import React, { useEffect } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import { multiline } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { StepProps } from "../types";

function StepConfirmation({
  t,
  optimisticOperation,
  error,
  signed,
  transaction,
  source,
}: Readonly<StepProps>) {
  const selectedValidatorNodeId = transaction?.properties?.stakingNodeId ?? null;

  useEffect(() => {
    if (optimisticOperation && typeof selectedValidatorNodeId === "number") {
      track("staking_completed", {
        currency: "HBAR",
        validator: selectedValidatorNodeId,
        source,
        delegation: "delegation",
        flow: "stake",
      });
    }
  }, [optimisticOperation, source, selectedValidatorNodeId]);

  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category="Hedera delegation"
          name="Step Confirmed"
          flow="stake"
          action="delegation"
          currency="hedera"
        />
        <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />
        <SuccessDisplay
          title={<Trans i18nKey="hedera.delegation.flow.steps.confirmation.success.title" />}
          description={multiline(t("hedera.delegation.flow.steps.confirmation.success.text"))}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Hedera delegation"
          name="Step Confirmation Error"
          flow="stake"
          action="delegation"
          currency="hedera"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="hedera.delegation.flow.steps.confirmation.broadcastError" />}
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
}: Readonly<StepProps>) {
  const concernedOperation = optimisticOperation
    ? optimisticOperation.subOperations && optimisticOperation.subOperations.length > 0
      ? optimisticOperation.subOperations[0]
      : optimisticOperation
    : null;

  return (
    <Box horizontal alignItems="right">
      <Button data-testid="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {concernedOperation ? (
        <Button
          primary
          ml={2}
          event="Hedera Delegation View OpD Clicked"
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
          <Trans i18nKey="hedera.delegation.flow.steps.confirmation.success.cta" />
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
}

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;

export default StepConfirmation;
