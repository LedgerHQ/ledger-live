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
import type { Operation } from "@ledgerhq/types-live";
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
  account,
}: Readonly<StepProps>) {
  const valAddress = transaction?.valAddress;
  const currencyId = account.currency.id;

  useEffect(() => {
    if (optimisticOperation && valAddress) {
      track("staking_completed", {
        currency: currencyId.toUpperCase(),
        validator: valAddress,
        delegation: "delegation",
        flow: "stake",
        source,
      });
    }
  }, [currencyId, optimisticOperation, valAddress, source]);

  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category="Delegation EVM"
          name="Step Confirmed"
          flow="stake"
          action="delegation"
          currency={account.currency.id}
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={<Trans i18nKey="cosmos.delegation.flow.steps.confirmation.success.title" />}
          description={multiline(t("cosmos.delegation.flow.steps.confirmation.success.text"))}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Delegation EVM"
          name="Step Confirmation Error"
          flow="stake"
          action="delegation"
          currency={account.currency.id}
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="cosmos.delegation.flow.steps.confirmation.broadcastError" />}
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
  let concernedOperation: Operation | null = null;
  if (optimisticOperation) {
    const firstSubOperation = optimisticOperation.subOperations?.[0];
    concernedOperation = firstSubOperation ?? optimisticOperation;
  }

  let footerSecondaryAction: React.ReactNode = null;
  if (concernedOperation) {
    footerSecondaryAction = (
      <Button
        primary
        ml={2}
        event="Delegation EVM Step 3 View OpD Clicked"
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
        <Trans i18nKey="cosmos.delegation.flow.steps.confirmation.success.cta" />
      </Button>
    );
  } else if (error) {
    footerSecondaryAction = <RetryButton primary ml={2} onClick={onRetry} />;
  }

  return (
    <Box horizontal alignItems="right">
      <Button data-testid="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {footerSecondaryAction}
    </Box>
  );
}

export default StepConfirmation;
