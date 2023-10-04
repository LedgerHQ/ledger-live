// @flow

import invariant from "invariant";
import { useSelector } from "react-redux";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled, { withTheme } from "styled-components";
import { useVotingPowerLoading } from "@ledgerhq/live-common/families/icon/react";
import { useTimer } from "@ledgerhq/live-common/hooks/useTimer";
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
import ToolTip from "~/renderer/components/Tooltip";
import Text from "~/renderer/components/Text";

import type { StepProps } from "../types";

const Container: ThemedComponent<{ shouldSpace?: boolean }> = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;

function StepConfirmation({
  account,
  t,
  optimisticOperation,
  error,
  theme,
  device,
  signed,
  transaction,
}: StepProps) {
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage category="Freeze Flow" name="Step Confirmed" />
        <SuccessDisplay
          title={<Trans i18nKey="icon.unfreeze.steps.confirmation.success.title" />}
          description={multiline(t(`icon.unfreeze.steps.confirmation.success.text`))}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage category="Freeze Flow" name="Step Confirmation Error" />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="icon.unfreeze.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }

  return null;
}

export function StepConfirmationFooter({
  t,
  transitionTo,
  account: initialAccount,
  onRetry,
  error,
  openModal,
  onClose,
}: StepProps) {
  invariant(initialAccount, "icon account required");
  const account = useSelector(s => accountSelector(s, { accountId: initialAccount.id }));
  invariant(account, "icon account still exists");

  const time = useTimer(20);
  const isLoading = useVotingPowerLoading(account);

  return error ? (
    <RetryButton ml={2} primary onClick={onRetry} />
  ) : (
    <Box horizontal alignItems="right">
      <Button
        ml={2}
        primary
        event="Unfreeze Flow Step 3 View OpD Clicked"
        onClick={onClose}
        secondary
      >
        <Trans i18nKey="icon.unfreeze.steps.confirmation.success.close" />
      </Button>
    </Box>
  );
}

export default withTheme(StepConfirmation);
