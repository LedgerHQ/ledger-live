import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import { StepProps } from "../types";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;
function StepConfirmation({ optimisticOperation, error, signed, mode }: StepProps) {
  const action = mode.replace(/([A-Z])/g, "_$1").toLowerCase();
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category="Polkadot SimpleOperationFlow"
          name="Step Confirmed"
          flow="stake"
          action={action}
          currency="dot"
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={<Trans i18nKey={`polkadot.simpleOperation.steps.confirmation.success.title`} />}
          description={
            <div>
              <Trans i18nKey={`polkadot.simpleOperation.steps.confirmation.success.text`}>
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
          category="Polkadot Flow"
          name="Step Confirmation Error"
          flow="stake"
          action={action}
          currency="dot"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="polkadot.simpleOperation.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }
  return null;
}
export function StepConfirmationFooter({ onRetry, error, onClose }: StepProps) {
  return (
    <Box horizontal alignItems="right">
      {error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : (
        <Button
          primary
          ml={2}
          event="ClaimRewards Algorand Flow Step 3 View OpD Clicked"
          onClick={onClose}
        >
          <Trans i18nKey="polkadot.simpleOperation.steps.confirmation.success.cta" />
        </Button>
      )}
    </Box>
  );
}
export default StepConfirmation;
