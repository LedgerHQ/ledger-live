import { useSelector } from "react-redux";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { withTheme } from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { accountSelector } from "~/renderer/reducers/accounts";
import TrackPage from "~/renderer/analytics/TrackPage";
import { multiline } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import * as S from "./StepConfirmation.styles";
import { StepProps } from "../types";
export const StepConfirmationFooter = ({
  account: initialAccount,
  onRetry,
  error,
  onClose,
  optimisticOperation,
}: StepProps) => {
  const account = useSelector(s =>
    accountSelector(s, {
      accountId: initialAccount?.id,
    }),
  );
  const goToOperationDetails = useCallback(() => {
    onClose();
    if (account && optimisticOperation) {
      setDrawer(OperationDetails, {
        operationId: optimisticOperation.id,
        accountId: account.id,
      });
    }
  }, [account, optimisticOperation, onClose]);
  if (error) {
    return <RetryButton ml={2} primary onClick={onRetry} />;
  }
  return (
    <Box horizontal alignItems="right">
      <Button data-test-id="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {/**
       * We're rendering the <SyncOneAccountOnMount /> component
       * here to ensure that it will always be rendered after a transaction
       * is broadcasted so that account balances are correct/up-to-date
       * before a future operation/transaction can be created.
       */}
      <SyncOneAccountOnMount priority={10} accountId={account.id} />
      {optimisticOperation ? (
        <Button
          primary
          ml={2}
          event="Lock Flow Step 3 View OpD Clicked"
          onClick={goToOperationDetails}
        >
          <Trans i18nKey="celo.lock.steps.confirmation.success.cta" />
        </Button>
      ) : null}
    </Box>
  );
};
const StepConfirmation = ({
  t,
  optimisticOperation,
  error,
  signed,
}: StepProps & {
  theme: any;
}) => {
  if (optimisticOperation) {
    return (
      <S.Container>
        <TrackPage category="Celo Lock" name="Step Confirmed" />
        <SuccessDisplay
          title={<Trans i18nKey="celo.lock.steps.confirmation.success.title" />}
          description={multiline(t("celo.lock.steps.confirmation.success.textVote"))}
        />
      </S.Container>
    );
  }
  if (error) {
    return (
      <S.Container shouldSpace={signed}>
        <TrackPage category="Celo Lock" name="Step Confirmation Error" />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="celo.lock.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </S.Container>
    );
  }
  return null;
};
export default withTheme(StepConfirmation);
