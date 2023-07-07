import React, { useEffect, useMemo } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
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
import { usePolkadotPreloadData } from "@ledgerhq/live-common/families/polkadot/react";

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
}: StepProps) {
  const preloaded = usePolkadotPreloadData();
  const { validators: allValidators } = preloaded;

  const validators = useMemo(() => {
    return allValidators
      .filter(val => transaction?.validators?.includes(val.address))
      .map(val => val.identity || val.address);
  }, [allValidators, transaction?.validators]);

  useEffect(() => {
    if (optimisticOperation && validators) {
      track("staking_completed", {
        currency: "DOT",
        validator: validators,
        source,
        delegation: "nomination",
        flow: "stake",
      });
    }
  }, [optimisticOperation, validators, source]);

  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category="Nomination Polkadot"
          name="Step Confirmed"
          flow="stake"
          action="nomination"
          currency="dot"
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={<Trans i18nKey="polkadot.nominate.steps.confirmation.success.title" />}
          description={multiline(t("polkadot.nominate.steps.confirmation.success.text"))}
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Nomination Polkadot"
          name="Step Confirmation Error"
          flow="stake"
          action="nomination"
          currency="dot"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="polkadot.nominate.steps.confirmation.broadcastError" />}
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
}: StepProps) {
  return (
    <Box horizontal alignItems="right">
      <Button data-test-id="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {optimisticOperation ? (
        // FIXME make a standalone component!
        <Button
          primary
          ml={2}
          event="Nominate Flow Step 3 View OpD Clicked"
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
          <Trans i18nKey="polkadot.nominate.steps.confirmation.success.cta" />
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
}
export default StepConfirmation;
