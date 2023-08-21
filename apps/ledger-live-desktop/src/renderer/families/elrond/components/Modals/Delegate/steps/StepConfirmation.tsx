import React, { useEffect } from "react";
import { Trans } from "react-i18next";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import styled from "styled-components";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { multiline } from "~/renderer/styles/helpers";
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
const StepConfirmation = (props: StepProps) => {
  const {
    t,
    optimisticOperation = {},
    account,
    error,
    signed,
    transaction,
    source,
    validators,
  } = props;
  const voteAccAddress = transaction?.recipient;
  useEffect(() => {
    if (optimisticOperation && voteAccAddress && validators) {
      const chosenValidator = validators.find(v => v.contract === voteAccAddress);
      track("staking_completed", {
        currency: "EGLD",
        validator: chosenValidator?.identity?.name || voteAccAddress,
        source,
        delegation: "delegation",
        flow: "stake",
      });
    }
  }, [optimisticOperation, validators, voteAccAddress, source]);

  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category="Delegation Cosmos"
          name="Step Confirmed"
          flow="stake"
          action="delegate"
          currency="egld"
        />
        {account ? <SyncOneAccountOnMount priority={10} accountId={account.id} /> : null}

        <SuccessDisplay
          title={<Trans i18nKey="elrond.delegation.flow.steps.confirmation.success.title" />}
          description={multiline(t("elrond.delegation.flow.steps.confirmation.success.text"))}
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Delegation Elrond"
          name="Step Confirmation Error"
          flow="stake"
          action="delegate"
          currency="egld"
        />

        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="elrond.delegation.flow.steps.confirmation.broadcastError" />}
          />
        ) : null}

        <ErrorDisplay error={error} withExportLogs={true} />
      </Container>
    );
  }
  return null;
};
const StepConfirmationFooter = (props: StepProps) => {
  const { account, onRetry, error, onClose, optimisticOperation } = props;
  const concernedOperation = optimisticOperation;
  return (
    <Box horizontal alignItems="right">
      <Button data-test-id="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>

      {concernedOperation ? (
        <Button
          primary={true}
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
          <Trans i18nKey="elrond.delegation.flow.steps.confirmation.success.cta" />
        </Button>
      ) : error ? (
        <RetryButton primary={true} ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
};
export { StepConfirmationFooter };
export default StepConfirmation;
