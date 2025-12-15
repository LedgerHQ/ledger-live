import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import { multiline } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import type { StepProps } from "../types";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "neutral.c100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;

function StepConfirmation({ t, status, error }: Readonly<StepProps>) {
  if (!error) {
    return (
      <Container>
        <TrackPage
          category="Export ZCash key"
          name="Step Confirmation"
          flow="exportUfvk"
          action="export"
          currency="zcash"
        />
        <SuccessDisplay
          title={<Trans i18nKey="zcash.shielded.flows.export.steps.confirmation.success.title" />}
          description={multiline(t("zcash.shielded.flows.export.steps.confirmation.success.text"))}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <TrackPage
          category="ZCash Shielded"
          name="Step Confirmation Error"
          flow="exportUfvk"
          action="export"
          currency="zcash"
        />
        <BroadcastErrorDisclaimer
          title={<Trans i18nKey="zcash.shielded.flows.export.steps.confirmation.error.text" />}
        />
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }
  return null;
}

export function StepConfirmationFooter({ account, onRetry, error, onClose }: Readonly<StepProps>) {
  return (
    <Box horizontal alignItems="right">
      <Button data-testid="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {error ? <RetryButton primary ml={2} onClick={onRetry} /> : null}
    </Box>
  );
}

export default StepConfirmation;
