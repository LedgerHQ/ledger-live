// @flow

import React from "react";
import { Trans } from "react-i18next";
import styled, { withTheme } from "styled-components";

import { SyncOneAccountOnMount } from "@ledgerhq/live-common/lib/bridge/react";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { multiline } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";

import type { StepProps } from "../types";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";

const Container: ThemedComponent<{ shouldSpace?: boolean }> = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;

function StepConfirmation({
  t,
  transaction,
  optimisticOperation,
  error,
  signed,
}: StepProps & { theme: * }) {
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage category="Activate Flow" name="Step Confirmed" />
        <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />
        <SuccessDisplay
          title={<Trans i18nKey="celo.activate.steps.confirmation.success.title" />}
          description={multiline(
            t("celo.activate.steps.confirmation.success.text", {
              resource: transaction && transaction.resource && transaction.resource.toLowerCase(),
            }),
          )}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage category="Activate Flow" name="Step Confirmation Error" />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="celo.activate.steps.confirmation.broadcastError" />}
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
  parentAccount,
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
          event="Activate Flow Step 3 View OpD Clicked"
          onClick={() => {
            onClose();
            if (account && optimisticOperation) {
              setDrawer(OperationDetails, {
                operationId: optimisticOperation.id,
                accountId: account.id,
                parentId: parentAccount && parentAccount.id,
              });
            }
          }}
        >
          <Trans i18nKey="celo.activate.steps.confirmation.success.cta" />
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
}

export default withTheme(StepConfirmation);
