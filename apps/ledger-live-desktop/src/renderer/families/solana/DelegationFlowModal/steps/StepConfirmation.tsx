import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { useValidators } from "@ledgerhq/live-common/families/solana/react";
import { StakeCreateAccountTransaction } from "@ledgerhq/live-common/families/solana/types";
import React, { useEffect } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
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
  color: "palette.text.shade100",
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
}: StepProps) {
  const voteAccAddress = (transaction?.model?.uiState as StakeCreateAccountTransaction["uiState"])
    ?.delegate?.voteAccAddress;
  const validators = useValidators(account.currency);
  useEffect(() => {
    if (optimisticOperation && voteAccAddress && validators) {
      const chosenValidator = validators.find(v => v.voteAccount === voteAccAddress);
      track("staking_completed", {
        currency: "SOL",
        validator: chosenValidator?.name || voteAccAddress,
        source,
        delegation: "delegation",
        flow: "stake",
      });
    }
  }, [optimisticOperation, account.currency, voteAccAddress, validators, source]);

  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category="Solana Delegation"
          name="Step Confirmation"
          flow="stake"
          action="delegation"
          currency="sol"
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={<Trans i18nKey="solana.delegation.flow.steps.confirmation.success.title" />}
          description={multiline(t("solana.delegation.statusUpdateNotice"))}
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Delegation Solana"
          name="Step Confirmation Error"
          flow="stake"
          action="delegation"
          currency="sol"
        />
        {signed ? (
          <BroadcastErrorDisclaimer title={<Trans i18nKey="solana.common.broadcastError" />} />
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
        <Button
          primary
          ml={2}
          event="Solana Delegation View OpD Clicked"
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
          <Trans i18nKey="solana.common.viewDetails" />
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
}
export default StepConfirmation;
