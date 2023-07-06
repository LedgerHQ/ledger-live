import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import RetryButton from "~/renderer/components/RetryButton";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { multiline } from "~/renderer/styles/helpers";
import { StepProps } from "../types";
import * as S from "./StepConfirmation.styles";
export const StepConfirmationFooter = ({
  account,
  onRetry,
  error,
  onClose,
  optimisticOperation,
}: StepProps) => {
  return (
    <Box horizontal alignItems="right">
      {/**
       * We're rendering the <SyncOneAccountOnMount /> component
       * here to ensure that it will always be rendered after a transaction
       * is broadcasted so that account balances are correct/up-to-date
       * before a future operation/transaction can be created.
       */}
      <SyncOneAccountOnMount priority={10} accountId={account.id} />
      <Button data-test-id="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {optimisticOperation ? (
        <Button
          primary
          ml={2}
          event="Withdraw Flow Step 3 View OpD Clicked"
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
          <Trans i18nKey="celo.withdraw.steps.confirmation.success.cta" />
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
};
const StepConfirmation = ({ t, optimisticOperation, error, signed }: StepProps) => {
  if (optimisticOperation) {
    return (
      <S.Container>
        <TrackPage
          category="Celo Withdraw"
          name="Step Confirmed"
          flow="stake"
          action="withdraw"
          currency="celo"
        />
        <SuccessDisplay
          title={<Trans i18nKey="celo.withdraw.steps.confirmation.success.title" />}
          description={multiline(t("celo.withdraw.steps.confirmation.success.text"))}
        />
      </S.Container>
    );
  }
  if (error) {
    return (
      <S.Container shouldSpace={signed}>
        <TrackPage
          category="Celo Withdraw"
          name="Step Confirmation Error"
          flow="stake"
          action="withdraw"
          currency="celo"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="celo.withdraw.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </S.Container>
    );
  }
  return null;
};
export default StepConfirmation;
