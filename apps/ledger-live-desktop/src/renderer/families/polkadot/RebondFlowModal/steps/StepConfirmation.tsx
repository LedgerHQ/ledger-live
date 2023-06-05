import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
// import { usePolkadotRebondLoading } from "@ledgerhq/live-common/families/tron/react";
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
  color: "palette.text.shade100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;
function StepConfirmation({ t, optimisticOperation, error, signed }: StepProps) {
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage category="Rebond Flow" name="Step Confirmed" />
        <SuccessDisplay
          title={<Trans i18nKey="polkadot.rebond.steps.confirmation.success.title" />}
          description={multiline(t("polkadot.rebond.steps.confirmation.success.text"))}
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage category="Rebond Flow" name="Step Confirmation Error" />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="polkadot.rebond.steps.confirmation.broadcastError" />}
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
  return (
    <Box horizontal alignItems="right">
      <Button data-test-id="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {optimisticOperation ? (
        // FIXME make a standalone component!
        <Button
          primary
          ml={2}
          event="Rebond Flow Step 3 View OpD Clicked"
          onClick={() => {
            onClose();
            if (account && optimisticOperation) {
              setDrawer(OperationDetails, {
                operationId: optimisticOperation.id,
                accountId: account.id,
              });
            }
          }}
        >
          <Trans i18nKey="polkadot.rebond.steps.confirmation.success.cta" />
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
}
export default StepConfirmation;
