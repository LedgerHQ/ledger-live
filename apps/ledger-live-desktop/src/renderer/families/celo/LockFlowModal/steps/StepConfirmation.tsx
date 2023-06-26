import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import React, { useCallback, useEffect } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useTrack } from "~/renderer/analytics/segment";
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
const StepConfirmation = ({ t, optimisticOperation, error, signed, source }: StepProps) => {
  const track = useTrack();
  useEffect(() => {
    if (optimisticOperation) {
      track("staking_completed", {
        currency: "CELO",
        source,
        delegation: "lock",
        flow: "stake",
      });
    }
  }, [optimisticOperation, source]);

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
export default StepConfirmation;
