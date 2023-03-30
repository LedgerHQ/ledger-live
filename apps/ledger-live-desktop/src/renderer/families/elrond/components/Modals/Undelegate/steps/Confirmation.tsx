import React, { useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import styled from "styled-components";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import RetryButton from "~/renderer/components/RetryButton";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
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
  const { t } = useTranslation();
  if (optimisticOperation) {
    const provider: string | undefined = transaction && transaction.recipient;
    const v: ElrondProvider | undefined =
      provider && validators.find(validator => validator.contract === provider);
    const amount = `${denominate({
      input: String(transaction.amount),
      decimals: 4,
    })} ${getAccountUnit(account).code || "EGLD"}`;
    return (
      <Container>
        <TrackPage category="Undelegation Elrond Flow" name="Step Confirmed" />
        <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />
        <SuccessDisplay
          title={t("elrond.undelegation.flow.steps.confirmation.success.title")}
          description={
            <div>
              <Trans
                i18nKey="elrond.undelegation.flow.steps.confirmation.success.description"
                values={{
                  amount,
                  validator: (v && v.identity.name) || v.contract,
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
        <TrackPage category="Undelegation Elrond Flow" name="Step Confirmation Error" />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={t("elrond.undelegation.flow.steps.confirmation.broadcastError")}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs={true} />
      </Container>
    );
  }
  return null;
};
const StepConfirmationFooter = (props: StepProps) => {
  const { account, parentAccount, error, onClose, onRetry, optimisticOperation } = props;
  const { t } = useTranslation();
  const concernedOperation = optimisticOperation
    ? optimisticOperation.subOperations && optimisticOperation.subOperations.length > 0
      ? optimisticOperation.subOperations[0]
      : optimisticOperation
    : null;
  const onViewDetails = useCallback(() => {
    onClose();
    if (account && concernedOperation) {
      setDrawer(OperationDetails, {
        operationId: concernedOperation.id,
        accountId: account.id,
        parentId: parentAccount && parentAccount.id,
      });
    }
  }, [onClose, account, concernedOperation, parentAccount]);
  return (
    <Box horizontal alignItems="right">
      <Button ml={2} onClick={onClose}>
        {t("common.close")}
      </Button>

      {concernedOperation ? (
        <Button
          primary={true}
          ml={2}
          event="Undelegation Elrond Flow Step 3 View OpD Clicked"
          onClick={onViewDetails}
        >
          {t("elrond.undelegation.flow.steps.confirmation.success.cta")}
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
};
export { StepConfirmationFooter };
export default StepConfirmation;
