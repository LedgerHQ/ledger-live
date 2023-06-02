import React, { useEffect } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { useLedgerFirstShuffledValidatorsCosmosFamily } from "@ledgerhq/live-common/families/cosmos/react";
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
  const voteAccAddress = transaction?.validators[0]?.address;
  const currencyName = account.currency.name.toLowerCase();
  const validators = useLedgerFirstShuffledValidatorsCosmosFamily(currencyName);

  useEffect(() => {
    if (optimisticOperation && voteAccAddress && validators) {
      const chosenValidator = validators.find(v => v.validatorAddress === voteAccAddress);
      const currency = account?.currency?.id?.toUpperCase();
      track("staking_completed", {
        currency,
        validator: chosenValidator?.name || voteAccAddress,
        delegation: "delegation",
        flow: "stake",
        source,
      });
    }
  }, [optimisticOperation, validators, account.currency.id, voteAccAddress, source]);

  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage category="Delegation Cosmos" name="Step Confirmed" />
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
        <TrackPage category="Delegation Cosmos" name="Step Confirmation Error" />
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
  transaction,
}: StepProps) {
  const concernedOperation =
    transaction?.validators.length === 1 && optimisticOperation
      ? optimisticOperation.subOperations && optimisticOperation.subOperations.length > 0
        ? optimisticOperation.subOperations[0]
        : optimisticOperation
      : null;
  return (
    <Box horizontal alignItems="right">
      <Button data-test-id="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {concernedOperation ? (
        // FIXME make a standalone component!
        <Button
          primary
          ml={2}
          event="Vote Flow Step 3 View OpD Clicked"
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
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
}
export default StepConfirmation;
