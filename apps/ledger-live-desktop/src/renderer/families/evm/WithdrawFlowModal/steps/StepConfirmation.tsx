import React, { useEffect, useMemo } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
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
  optimisticOperation,
  error,
  signed,
  amount,
  source,
  account,
  validatorAddress,
}: Readonly<StepProps>) {
  const currencyId = account.currency.id;
  const unit = useAccountUnit(account);

  useEffect(() => {
    if (optimisticOperation && validatorAddress) {
      track("staking_completed", {
        currency: currencyId.toUpperCase(),
        validator: validatorAddress,
        delegation: "withdraw",
        flow: "stake",
        source,
      });
    }
  }, [currencyId, optimisticOperation, validatorAddress, source]);

  const validatorName = useMemo(() => {
    const validator = account.stakingResources.validators?.find(
      v => v.validatorAddress === validatorAddress,
    );
    return validator?.name ?? validatorAddress;
  }, [account.stakingResources.validators, validatorAddress]);

  if (optimisticOperation) {
    const formattedAmount = amount ? formatCurrencyUnit(unit, amount, { showCode: true }) : "";
    return (
      <Container>
        <TrackPage
          category="Withdraw Flow EVM"
          name="Step Confirmed"
          flow="stake"
          action="withdraw"
          currency={currencyId}
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={
            <Trans i18nKey="ethereum.evmStaking.withdraw.flow.steps.confirmation.success.title" />
          }
          description={
            <div>
              <Trans
                i18nKey="ethereum.evmStaking.withdraw.flow.steps.confirmation.success.description"
                values={{ amount: formattedAmount, validator: validatorName }}
              >
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
          category="Withdraw Flow EVM"
          name="Step Confirmation Error"
          flow="stake"
          action="withdraw"
          currency={currencyId}
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={
              <Trans i18nKey="ethereum.evmStaking.withdraw.flow.steps.confirmation.broadcastError" />
            }
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
  const concernedOperation = optimisticOperation
    ? (optimisticOperation.subOperations?.[0] ?? optimisticOperation)
    : null;
  let footerSecondaryAction: React.ReactNode = null;
  if (concernedOperation) {
    footerSecondaryAction = (
      <Button
        primary
        ml={2}
        event="Withdraw EVM Step 3 View OpD Clicked"
        onClick={() => {
          onClose();
          if (account) {
            setDrawer(OperationDetails, {
              operationId: concernedOperation.id,
              accountId: account.id,
            });
          }
        }}
      >
        <Trans i18nKey="ethereum.evmStaking.withdraw.flow.steps.confirmation.success.cta" />
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
