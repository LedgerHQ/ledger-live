import invariant from "invariant";
import React, { useCallback, useEffect } from "react";
import { Trans } from "react-i18next";
import { useNavigate } from "react-router";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import TrackPage, { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import RetryButton from "~/renderer/components/RetryButton";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { multiline } from "~/renderer/styles/helpers";
import { urls } from "~/config/urls";
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
  parentAccount,
  optimisticOperation,
  error,
  signed,
  transaction,
  source,
}: StepProps) => {
  invariant(transaction?.family === "tezos", "tezos transaction required");

  useEffect(() => {
    if (optimisticOperation) {
      track("staking_completed", {
        currency: "XTZ",
        source,
        delegation: transaction.mode,
        flow: "stake",
      });
    }
  }, [optimisticOperation, source, transaction.mode]);

  if (optimisticOperation) {
    const mainAccount = account ? getMainAccount(account, parentAccount) : null;
    const unit = mainAccount?.currency.units[0];
    const amountText = unit
      ? formatCurrencyUnit(unit, transaction.amount, { showCode: true, disableRounding: true })
      : "";

    return (
      <Container>
        <TrackPage
          category="Stake Flow"
          name="Step Confirmed"
          flow="stake"
          action="stake"
          currency="xtz"
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={<Trans i18nKey="tezos.stake.flow.steps.confirmation.success.title" />}
          description={multiline(
            t("tezos.stake.flow.steps.confirmation.success.text", { amount: amountText }),
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
          action="stake"
          currency="xtz"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="tezos.stake.flow.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }
  return null;
};

export const StepConfirmationFooter = ({
  transitionTo,
  onRetry,
  optimisticOperation,
  error,
  failedStep,
  onClose,
}: StepProps) => {
  const navigate = useNavigate();
  const stakingUrl = useLocalizedUrl(urls.stakingTezos);

  const onVisitEarnDashboard = useCallback(() => {
    onClose();
    setTrackingSource("stake flow");
    navigate("/earn");
  }, [navigate, onClose]);

  const onRetryClick = useCallback(() => {
    onRetry();
    transitionTo(failedStep ?? "amount");
  }, [failedStep, onRetry, transitionTo]);

  let action: React.ReactNode = null;
  if (optimisticOperation) {
    action = (
      <Button
        ml={2}
        id="tezos-stake-confirmation-visit-earn-button"
        primary
        onClick={onVisitEarnDashboard}
      >
        <Trans i18nKey="tezos.stake.flow.steps.confirmation.success.cta" />
      </Button>
    );
  } else if (error) {
    action = <RetryButton ml={2} primary onClick={onRetryClick} />;
  }

  return (
    <>
      <Box mr={2} ff="Inter|SemiBold" fontSize={4}>
        <LinkWithExternalIcon
          label={<Trans i18nKey="tezos.stake.flow.steps.confirmation.howItWorks" />}
          onClick={() => openURL(stakingUrl)}
        />
      </Box>
      {action}
    </>
  );
};

export default StepConfirmation;
