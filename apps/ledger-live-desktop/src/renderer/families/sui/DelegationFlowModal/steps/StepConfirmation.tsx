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
const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "neutral.c100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;
function StepConfirmation({
  t,
  optimisticOperation,
  error,
  signed,
  transaction,
  source,
}: StepProps) {
  useEffect(() => {
    const voteAccAddress = transaction?.recipient;
    if (optimisticOperation && voteAccAddress) {
      track("staking_completed", {
        currency: "SUI",
        validator: voteAccAddress,
        source,
        delegation: "delegation",
        flow: "stake",
      });
    }
  }, [optimisticOperation, source, transaction?.recipient]);

  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category="Delegation Flow"
          name="Step Confirmed"
          flow="stake"
          action="staking"
          currency="sui"
        />
        <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />
        <SuccessDisplay
          title={<Trans i18nKey="sui.stake.flow.steps.confirmation.success.title" />}
          description={multiline(t("sui.stake.flow.steps.confirmation.success.text"))}
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Stake Sui"
          name="Step Confirmation Error"
          flow="stake"
          action="staking"
          currency="sui"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="sui.stake.flow.steps.confirmation.broadcastError" />}
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
  let concernedOperation = optimisticOperation || null;
  if (optimisticOperation) {
    concernedOperation =
      optimisticOperation.subOperations && optimisticOperation.subOperations.length > 0
        ? optimisticOperation.subOperations[0]
        : optimisticOperation;
  }
  return (
    <Box horizontal alignItems="right">
      <Button data-testid="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {concernedOperation && (
        <Button
          primary
          ml={2}
          event="Vote Flow Step 3 View OpD Clicked"
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
          <Trans i18nKey="sui.stake.flow.steps.confirmation.success.cta" />
        </Button>
      )}
      {!concernedOperation && error && <RetryButton primary ml={2} onClick={onRetry} />}
    </Box>
  );
}
export default StepConfirmation;
