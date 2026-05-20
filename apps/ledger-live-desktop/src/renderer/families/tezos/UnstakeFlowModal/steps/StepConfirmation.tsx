import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import RetryButton from "~/renderer/components/RetryButton";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { multiline } from "~/renderer/styles/helpers";
import { StepProps } from "../types";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "neutral.c100",
}))<{ shouldSpace?: boolean }>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;

const StepConfirmation = ({ t, optimisticOperation, error, signed }: StepProps) => {
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category="Unstake Flow"
          name="Step Confirmed"
          flow="stake"
          action="unstake"
          currency="xtz"
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={<Trans i18nKey="tezos.unstake.flow.steps.confirmation.success.title" />}
          description={multiline(t("tezos.unstake.flow.steps.confirmation.success.text"))}
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Unstake Flow"
          name="Step Confirmation Error"
          flow="stake"
          action="unstake"
          currency="xtz"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="tezos.unstake.flow.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }
  return null;
};

export const StepConfirmationFooter = ({
  account,
  onRetry,
  error,
  onClose,
  optimisticOperation,
}: StepProps) => (
  <Box horizontal justifyContent="flex-end">
    <Button data-testid="modal-close-button" ml={2} onClick={onClose}>
      <Trans i18nKey="common.close" />
    </Button>
    {optimisticOperation ? (
      <Button
        primary
        ml={2}
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
        <Trans i18nKey="tezos.unstake.flow.steps.confirmation.success.cta" />
      </Button>
    ) : error ? (
      <RetryButton primary ml={2} onClick={onRetry} />
    ) : null}
  </Box>
);

export default StepConfirmation;
