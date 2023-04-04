import React from "react";
import { Trans } from "react-i18next";
import styled, { withTheme } from "styled-components";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
import { StepProps } from "../types";
const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;
const StepConfirmation = (props: StepProps) => {
  const { optimisticOperation, error, signed, account, transaction, validators } = props;
  if (optimisticOperation) {
    const provider: string | undefined = transaction && transaction.recipient;
    const v: ElrondProvider | undefined =
      provider && validators.find(validator => validator.contract === provider);
    const amount = `${denominate({
      input: String(transaction.amount),
      decimals: 4,
    })} ${getAccountUnit(account).code || "EGLD"}`;
    const titleKey = transaction?.mode === "claimRewards" ? "title" : "titleCompound";
    const textKey = transaction?.mode === "claimRewards" ? "text" : "textCompound";
    return (
      <Container>
        <TrackPage category="ClaimRewards Elrond Flow" name="Step Confirmed" />
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
                  validator: v && v.name,
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
        <TrackPage category="ClaimRewards Elrond Flow" name="Step Confirmation Error" />
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
  const { account, parentAccount, onRetry, error, onClose, optimisticOperation } = props;
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
                parentId: parentAccount && parentAccount.id,
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
export default withTheme(StepConfirmation);
