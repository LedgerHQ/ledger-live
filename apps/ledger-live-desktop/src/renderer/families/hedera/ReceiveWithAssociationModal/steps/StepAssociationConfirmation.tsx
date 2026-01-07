import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { isTokenAssociateTransaction } from "@ledgerhq/live-common/families/hedera/utils";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import RetryButton from "~/renderer/components/RetryButton";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import TrackPage from "~/renderer/analytics/TrackPage";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import type { StepProps } from "../types";

const Container = styled(Box).attrs<{
  shouldSpace?: boolean;
}>(() => ({
  alignItems: "center",
  grow: true,
  color: "neutral.c100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;

function StepAssociationConfirmation({
  transaction,
  optimisticOperation,
  error,
  signed,
}: StepProps) {
  if (optimisticOperation) {
    invariant(isTokenAssociateTransaction(transaction), "hedera: token associate tx expected");
    const tokenName = transaction.properties.token.name ?? "token";

    return (
      <Container>
        <TrackPage
          category="Hedera Token Association Flow"
          name="Step Confirmed"
          flow="tokenAssociation"
        />
        <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />
        <SuccessDisplay
          title={
            <Trans i18nKey="hedera.receiveWithAssociation.steps.associationConfirmation.success.title" />
          }
          description={
            <Trans
              i18nKey="hedera.receiveWithAssociation.steps.associationConfirmation.success.description"
              values={{ tokenName }}
            />
          }
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Hedera Token Association Flow"
          name="Step Confirmation Error"
          flow="tokenAssociation"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={
              <Trans i18nKey="hedera.receiveWithAssociation.steps.associationConfirmation.broadcastError" />
            }
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }

  return null;
}

export function StepAssociationConfirmationFooter({
  account,
  parentAccount,
  optimisticOperation,
  error,
  onRetry,
  closeModal,
  onClose,
}: StepProps) {
  let concernedOperation = null;

  if (optimisticOperation) {
    const { subOperations } = optimisticOperation;
    const hasSubOperations = subOperations && subOperations.length > 0;
    concernedOperation = hasSubOperations ? subOperations[0] : optimisticOperation;
  }

  const closeModalAndViewDetails = () => {
    closeModal();
    if (account && concernedOperation) {
      setDrawer(OperationDetails, {
        operationId: concernedOperation.id,
        accountId: account.id,
        parentId: parentAccount?.id,
      });
    }
  };

  const renderActionButton = () => {
    if (concernedOperation) {
      return (
        <Button
          primary
          ml={2}
          id="hedera-token-association-confirmation-opc-button"
          event="Hedera Token Association Flow View OpD Clicked"
          onClick={closeModalAndViewDetails}
        >
          <Trans i18nKey="hedera.receiveWithAssociation.steps.associationConfirmation.success.cta" />
        </Button>
      );
    }

    if (error) {
      return <RetryButton primary ml={2} onClick={onRetry} />;
    }

    return null;
  };

  return (
    <Box horizontal alignItems="right">
      <Button data-testid="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {renderActionButton()}
    </Box>
  );
}

export default StepAssociationConfirmation;
