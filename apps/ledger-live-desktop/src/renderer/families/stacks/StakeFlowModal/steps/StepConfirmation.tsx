import React from "react";
import { Trans } from "react-i18next";
import { useNavigate } from "react-router";
import styled from "styled-components";
import invariant from "invariant";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import TrackPage, { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { getAccountUrl } from "~/renderer/utils";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import RetryButton from "~/renderer/components/RetryButton";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
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

const StepConfirmation = ({
  t,
  account,
  optimisticOperation,
  error,
  signed,
  transaction,
}: StepProps) => {
  invariant(transaction?.family === "stacks", "stacks transaction required");

  if (optimisticOperation) {
    const unit = account?.currency.units[0];
    const amountText = unit
      ? formatCurrencyUnit(unit, transaction.amount, { showCode: true, disableRounding: true })
      : "";

    return (
      <Container>
        <TrackPage
          category="Stake Flow"
          name="Step Confirmed"
          flow="stake"
          action="delegate"
          currency="stx"
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={<Trans i18nKey="stacks.stake.flow.steps.confirmation.success.title" />}
          description={multiline(
            t("stacks.stake.flow.steps.confirmation.success.text", { amount: amountText }),
          )}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Stake Flow"
          name="Step Confirmation Error"
          flow="stake"
          action="delegate"
          currency="stx"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="stacks.stake.flow.steps.confirmation.broadcastError" />}
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
  transitionTo,
  onRetry,
  optimisticOperation,
  error,
  onClose,
}: StepProps) => {
  const navigate = useNavigate();

  const onVisitAccountDashboard = () => {
    onClose();
    setTrackingSource("stake flow");
    const accountId = account?.id ?? optimisticOperation?.accountId;
    if (accountId) {
      navigate(getAccountUrl(accountId));
    }
  };

  const onRetryClick = () => {
    onRetry();
    transitionTo("amount");
  };

  if (optimisticOperation) {
    return (
      <Button
        ml={2}
        id="stacks-stake-confirmation-visit-account-button"
        primary
        onClick={onVisitAccountDashboard}
      >
        <Trans i18nKey="stacks.stake.flow.steps.confirmation.success.cta" />
      </Button>
    );
  }
  if (error) {
    return <RetryButton ml={2} primary onClick={onRetryClick} />;
  }
  return null;
};

export default StepConfirmation;
