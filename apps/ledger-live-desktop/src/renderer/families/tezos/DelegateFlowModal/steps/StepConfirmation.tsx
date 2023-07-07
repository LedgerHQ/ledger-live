import invariant from "invariant";
import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { multiline } from "~/renderer/styles/helpers";
import { urls } from "~/config/urls";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { openURL } from "~/renderer//linking";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { StepProps } from "../types";
import { useEffect } from "react";
import { useBaker } from "@ledgerhq/live-common/families/tezos/bakers";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))<{ shouldSpace?: boolean }>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;
const StepConfirmation = ({
  t,
  optimisticOperation,
  error,
  signed,
  transaction,
  eventType,
  source,
}: StepProps) => {
  invariant(
    transaction && transaction.family === "tezos",
    "transaction is required and must be of tezos family",
  );
  const baker = useBaker(transaction.recipient);
  const undelegating = transaction.mode === "undelegate";

  useEffect(() => {
    if (optimisticOperation) {
      track("staking_completed", {
        currency: "XTZ",
        validator: baker?.name || transaction.recipient,
        source,
        delegation: transaction.mode,
        flow: "stake",
      });
    }
  }, [baker?.name, optimisticOperation, transaction.mode, transaction.recipient, source]);
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category={`Delegation Flow${eventType ? ` (${eventType})` : ""}`}
          name="Step Confirmed"
          flow="stake"
          action="delegation"
          currency="xtz"
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={
            <Trans
              i18nKey={`delegation.flow.steps.confirmation.success.${
                undelegating ? "titleUndelegated" : "title"
              }`}
            />
          }
          description={multiline(
            t(
              `delegation.flow.steps.confirmation.success.${
                undelegating ? "textUndelegated" : "text"
              }`,
            ),
          )}
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Delegation Flow"
          name="Step Confirmation Error"
          flow="stake"
          action="delegation"
          currency="xtz"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="delegation.flow.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }
  return null;
};
export const StepConfirmationFooter = ({
  t,
  transitionTo,
  account,
  parentAccount,
  onRetry,
  optimisticOperation,
  error,
  onClose,
}: StepProps) => {
  const concernedOperation = optimisticOperation
    ? optimisticOperation.subOperations && optimisticOperation.subOperations.length > 0
      ? optimisticOperation.subOperations[0]
      : optimisticOperation
    : null;
  return (
    <>
      <Box mr={2} ff="Inter|SemiBold" fontSize={4}>
        <LinkWithExternalIcon
          label={<Trans i18nKey="delegation.howItWorks" />}
          onClick={() => openURL(urls.stakingTezos)}
        />
      </Box>
      {concernedOperation ? (
        <Button
          ml={2}
          id={"delegate-confirmation-details-button"}
          event="Delegation Flow Step 4 View OpD Clicked"
          onClick={() => {
            onClose();
            if (account && concernedOperation) {
              setDrawer(OperationDetails, {
                operationId: concernedOperation.id,
                accountId: account.id,
                parentId: parentAccount && parentAccount.id,
              });
            }
          }}
          primary
        >
          {t("send.steps.confirmation.success.cta")}
        </Button>
      ) : error ? (
        <RetryButton
          ml={2}
          primary
          onClick={() => {
            onRetry();
            transitionTo("summary");
          }}
        />
      ) : null}
    </>
  );
};
export default StepConfirmation;
