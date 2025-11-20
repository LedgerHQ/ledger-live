import React, { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { track } from "~/renderer/analytics/segment";
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

interface StyledBoxProps {
  "data-align"?: boolean | string;
}

const Container = styled(Box)<StyledBoxProps>`
  align-items: center;
  grow: true;
  color: palette.text.shade100;
  justify-content: center;
  [data-align="true"] {
    justify-content: space-between;
  }
`;

function StepConfirmation({
  optimisticOperation,
  error,
  signed,
  transaction,
  source,
}: Readonly<StepProps>) {
  useEffect(() => {
    const validatorAddress = transaction?.recipient;
    if (optimisticOperation && validatorAddress) {
      track("staking_completed", {
        currency: "MINA",
        validator: validatorAddress,
        source,
        delegation: "delegation",
        flow: "stake",
      });
    }
  }, [optimisticOperation, source, transaction?.recipient]);

  const { t } = useTranslation();

  if (optimisticOperation) {
    return (
      <Container data-align={signed}>
        <TrackPage
          category="Delegation Flow"
          name="Step Confirmed"
          flow="stake"
          action="staking"
          currency="mina"
        />
        <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />
        <SuccessDisplay
          title={t("mina.selectValidator.success.title")}
          description={t("mina.selectValidator.success.description")}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container data-align={signed}>
        <TrackPage
          category="Stake MINA"
          name="Step Confirmation Error"
          flow="stake"
          action="staking"
          currency="mina"
        />
        {signed && <BroadcastErrorDisclaimer title={t("mina.selectValidator.error.title")} />}
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
}: Readonly<StepProps>) {
  const hasSubOperations = (optimisticOperation?.subOperations?.length ?? 0) > 0;

  const concernedOperation = hasSubOperations
    ? optimisticOperation?.subOperations?.[0]
    : optimisticOperation;

  return (
    <Box horizontal alignItems="right">
      <Button data-testid="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {concernedOperation ? (
        <Button
          primary
          ml={2}
          event="Stake Flow Step 3 View OpD Clicked"
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
          <Trans i18nKey="common.close" />
        </Button>
      ) : (
        error && <RetryButton primary ml={2} onClick={onRetry} />
      )}
    </Box>
  );
}

export default StepConfirmation;
