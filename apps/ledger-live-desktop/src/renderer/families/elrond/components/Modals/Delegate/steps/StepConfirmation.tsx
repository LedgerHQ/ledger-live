import React from "react";
import { Trans } from "react-i18next";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import styled, { withTheme } from "styled-components";
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
const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;
const StepConfirmation = (props: StepProps) => {
  const { t, optimisticOperation = {}, error, signed } = props;
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage category="Delegation Cosmos" name="Step Confirmed" />
        <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />

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
        <TrackPage category="Delegation Elrond" name="Step Confirmation Error" />

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
  const { account, parentAccount, onRetry, error, onClose, optimisticOperation } = props;
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
                parentId: parentAccount && parentAccount.id,
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
export default withTheme(StepConfirmation);
