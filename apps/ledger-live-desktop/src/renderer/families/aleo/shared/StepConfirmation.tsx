import React, { useEffect } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { TFunction } from "i18next";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { Account, Operation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/families/aleo/types";
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

// Shared between BondPublicFlowModal / UnbondFlowModal / ClaimUnbondFlowModal:
// the three StepConfirmation.tsx files were byte-identical apart from i18n
// keys, tracking labels and the `staking_completed` payload field name, so
// this factory takes those as config and returns the pair of components each
// flow's steps array expects.

type StakingConfirmationProps = {
  t: TFunction;
  account?: Account | null;
  optimisticOperation?: Operation;
  error?: Error;
  signed: boolean;
  transaction?: Transaction | null;
  onRetry: (a: void) => void;
  onClose: () => void;
  source?: string;
};

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "neutral.c100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;

export type StakingConfirmationConfig = {
  /** e.g. "bond" | "unbond" | "claim" — used to build i18n keys and labels */
  flow: "bond" | "unbond" | "claim";
  /** e.g. "bonding" | "unbonding" | "claiming" — used for tracking */
  action: "bonding" | "unbonding" | "claiming";
  /** field name used in the `staking_completed` segment payload */
  trackField: "validator" | "staker";
};

export function createStepConfirmation({ flow, action, trackField }: StakingConfirmationConfig) {
  const i18nPrefix = `aleo.${flow}.flow.steps.confirmation`;
  const flowLabel = `${flow[0].toUpperCase()}${flow.slice(1)} Flow`;
  const category = `${flow[0].toUpperCase()}${flow.slice(1)} ALEO`;

  function StepConfirmation({
    t,
    optimisticOperation,
    error,
    signed,
    transaction,
    source,
  }: StakingConfirmationProps) {
    useEffect(() => {
      const address = transaction?.recipient;
      if (optimisticOperation && address) {
        track("staking_completed", {
          currency: "ALEO",
          [trackField]: address,
          source,
          delegation: action,
          flow,
        });
      }
    }, [optimisticOperation, source, transaction?.recipient]);

    if (optimisticOperation) {
      return (
        <Container>
          <TrackPage
            category="Delegation Flow"
            name="Step Confirmed"
            flow={flow}
            action={action}
            currency="aleo"
          />
          <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />
          <SuccessDisplay
            title={<Trans i18nKey={`${i18nPrefix}.success.title`} />}
            description={multiline(t(`${i18nPrefix}.success.text`))}
          />
        </Container>
      );
    }

    if (error) {
      return (
        <Container shouldSpace={signed}>
          <TrackPage
            category={category}
            name="Step Confirmation Error"
            flow={flow}
            action={action}
            currency="aleo"
          />
          {signed ? (
            <BroadcastErrorDisclaimer title={<Trans i18nKey={`${i18nPrefix}.broadcastError`} />} />
          ) : null}
          <ErrorDisplay error={error} withExportLogs />
        </Container>
      );
    }

    return null;
  }

  function StepConfirmationFooter({
    account,
    onRetry,
    error,
    onClose,
    optimisticOperation,
  }: StakingConfirmationProps) {
    const concernedOperation = optimisticOperation
      ? optimisticOperation.subOperations && optimisticOperation.subOperations.length > 0
        ? optimisticOperation.subOperations[0]
        : optimisticOperation
      : null;
    return (
      <Box horizontal alignItems="right">
        <Button data-testid="modal-close-button" ml={2} onClick={onClose}>
          <Trans i18nKey="common.close" />
        </Button>
        {concernedOperation ? (
          <Button
            primary
            ml={2}
            event={`${flowLabel} Step 3 View OpD Clicked`}
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
            <Trans i18nKey={`${i18nPrefix}.success.cta`} />
          </Button>
        ) : error ? (
          <RetryButton primary ml={2} onClick={onRetry} />
        ) : null}
      </Box>
    );
  }

  return { StepConfirmation, StepConfirmationFooter };
}
