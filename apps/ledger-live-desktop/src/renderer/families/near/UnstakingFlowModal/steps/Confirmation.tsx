import React, { useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import RetryButton from "~/renderer/components/RetryButton";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { StepProps } from "../types";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
export default function StepConfirmation({
  account,
  optimisticOperation,
  error,
  device,
  signed,
  transaction,
}: StepProps) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  if (optimisticOperation) {
    const unit = account && getAccountUnit(account);
    const amount =
      unit &&
      transaction &&
      formatCurrencyUnit(unit, transaction.amount, {
        showCode: true,
        locale,
      });
    return (
      <Container>
        <TrackPage category="Unstake NEAR Flow" name="Step Confirmed" />
        <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />
        <SuccessDisplay
          title={t("near.unstake.flow.steps.confirmation.success.title")}
          description={
            <div>
              <Trans
                i18nKey="near.unstake.flow.steps.confirmation.success.description"
                values={{
                  amount,
                  validator: transaction?.recipient,
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
        <TrackPage category="Unstake NEAR Flow" name="Step Confirmation Error" />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={t("near.unstake.flow.steps.confirmation.broadcastError")}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }
  return null;
}
const Container: ThemedComponent<{
  shouldSpace?: boolean;
}> = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;
export function StepConfirmationFooter({
  account,
  parentAccount,
  error,
  onClose,
  onRetry,
  openModal,
  optimisticOperation,
}: StepProps) {
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
          primary
          ml={2}
          event="Unstake NEAR Flow Step 3 View OpD Clicked"
          onClick={onViewDetails}
        >
          {t("near.unstake.flow.steps.confirmation.success.cta")}
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
}
