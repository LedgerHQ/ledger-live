import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { StepProps } from "../types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

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
  const { optimisticOperation, error, signed, account, transaction, validators } = props;

  const unit = useAccountUnit(account);
  if (optimisticOperation) {
    const provider: string | undefined = transaction && transaction.recipient;
    const v = provider ? validators?.find(validator => validator.contract === provider) : undefined;
    const amount = `${denominate({
      input: String(transaction?.amount),
      decimals: 4,
    })} ${unit.code || "EGLD"}`;
    const titleKey = transaction?.mode === "claimRewards" ? "title" : "titleCompound";
    const textKey = transaction?.mode === "claimRewards" ? "text" : "textCompound";
    return (
      <Container>
        <TrackPage
          category="ClaimRewards Elrond Flow"
          name="Step Confirmed"
          flow="stake"
          action="claim"
          currency="MultiversX"
        />
        <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />

        <SuccessDisplay
          title={
            <Trans i18nKey={`elrond.claimRewards.flow.steps.confirmation.success.${titleKey}`} />
          }
          description={
            <div>
              <Trans
                i18nKey={`elrond.claimRewards.flow.steps.confirmation.success.${textKey}`}
                values={{
                  amount,
                  validator: v?.identity.name,
                }}
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
          category="ClaimRewards Elrond Flow"
          name="Step Confirmation Error"
          flow="stake"
          action="claim"
          currency="MultiversX"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="elrond.claimRewards.flow.steps.confirmation.broadcastError" />}
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
  const concernedOperation = optimisticOperation
    ? optimisticOperation.subOperations && optimisticOperation.subOperations.length > 0
      ? optimisticOperation.subOperations[0]
      : optimisticOperation
    : null;
  return (
    <Box horizontal={true} alignItems="right">
      <Button ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>

      {concernedOperation ? (
        <Button
          primary={true}
          ml={2}
          event="ClaimRewards Elrond Flow Step 3 View OpD Clicked"
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
          <Trans i18nKey="elrond.claimRewards.flow.steps.confirmation.success.cta" />
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
};
export { StepConfirmationFooter };
export default StepConfirmation;
