// @flow

import { useSelector } from "react-redux";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled, { withTheme } from "styled-components";

import { accountSelector } from "~/renderer/reducers/accounts";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { multiline } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";

import type { StepProps } from "../types";

const Container: ThemedComponent<{ shouldSpace?: boolean }> = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;

function StepConfirmation({ t, optimisticOperation, error, signed }: StepProps & { theme: * }) {
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage category="Lock Flow" name="Step Confirmed" />
        <SuccessDisplay
          title={<Trans i18nKey="celo.lock.steps.confirmation.success.title" />}
          description={multiline(t("celo.lock.steps.confirmation.success.textVote"))}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage category="Lock Flow" name="Step Confirmation Error" />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="celo.lock.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }

  return null;
}

export function StepConfirmationFooter({
  account: initialAccount,
  onRetry,
  error,
  onClose,
  optimisticOperation,
}: StepProps) {
  const account = useSelector(s => accountSelector(s, { accountId: initialAccount.id }));

  const goToOperationDetails = useCallback(() => {
    onClose();
    if (account && optimisticOperation) {
      setDrawer(OperationDetails, {
        operationId: optimisticOperation.id,
        accountId: account.id,
      });
    }
  }, [account, optimisticOperation, onClose]);

  if (error) {
    return <RetryButton ml={2} primary onClick={onRetry} />;
  }

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
          event="Lock Flow Step 3 View OpD Clicked"
          onClick={goToOperationDetails}
        >
          <Trans i18nKey="celo.lock.steps.confirmation.success.cta" />
        </Button>
      ) : null}
    </Box>
  );
}

export default withTheme(StepConfirmation);
