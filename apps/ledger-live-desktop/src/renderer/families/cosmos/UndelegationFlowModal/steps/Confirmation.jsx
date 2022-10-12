// @flow
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
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { StepProps } from "../types";

import { useCosmosFamilyPreloadData } from "@ledgerhq/live-common/families/cosmos/react";
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
  const currencyName = account.currency.name.toLowerCase();
  const { validators } = useCosmosFamilyPreloadData(currencyName);
  const locale = useSelector(localeSelector);

  if (optimisticOperation) {
    const unit = account && getAccountUnit(account);

    const validator = transaction && transaction.validators ? transaction.validators[0] : null;

    const v =
      validator &&
      validators.find(({ validatorAddress }) => validatorAddress === validator.address);

    const amount =
      unit && validator && formatCurrencyUnit(unit, validator.amount, { showCode: true, locale });

    return (
      <Container>
        <TrackPage category="Undelegation Cosmos Flow" name="Step Confirmed" />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <SuccessDisplay
          title={t(`${currencyName}.undelegation.flow.steps.confirmation.success.title`)}
          description={
            <div>
              <Trans
                i18nKey={`${currencyName}.undelegation.flow.steps.confirmation.success.description`}
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
        <TrackPage category="Undelegation Cosmos Flow" name="Step Confirmation Error" />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={t(`${currencyName}.undelegation.flow.steps.confirmation.broadcastError`)}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }

  return null;
}

const Container: ThemedComponent<{ shouldSpace?: boolean }> = styled(Box).attrs(() => ({
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
  const currencyName = account.currency.name;

  return (
    <Box horizontal alignItems="right">
      <Button ml={2} onClick={onClose}>
        {t("common.close")}
      </Button>
      {concernedOperation ? (
        // FIXME make a standalone component!
        <Button
          primary
          ml={2}
          event={`Undelegation ${currencyName} Flow Step 3 View OpD Clicked`}
          onClick={onViewDetails}
        >
          {t(`${currencyName.toLowerCase()}.undelegation.flow.steps.confirmation.success.cta`)}
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
}
