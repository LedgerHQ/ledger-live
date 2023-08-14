import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { useValidatorGroups } from "@ledgerhq/live-common/families/celo/react";
import React, { useEffect } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
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
          event="Activate Flow Step 3 View OpD Clicked"
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
          <Trans i18nKey="celo.activate.steps.confirmation.success.cta" />
        </Button>
      ) : error ? (
        <RetryButton primary ml={2} onClick={onRetry} />
      ) : null}
    </Box>
  );
};
const StepConfirmation = ({
  t,
  transaction,
  optimisticOperation,
  error,
  signed,
  source,
}: StepProps) => {
  const voteAccAddress = transaction?.recipient;
  const validators = useValidatorGroups();
  useEffect(() => {
    if (optimisticOperation && voteAccAddress && validators) {
      const chosenValidator = validators.find(v => v.address === voteAccAddress);
      track("staking_completed", {
        currency: "CELO",
        validator: chosenValidator?.name || voteAccAddress,
        source,
        delegation: "activate",
        flow: "stake",
      });
    }
  }, [optimisticOperation, validators, voteAccAddress, source]);

  if (optimisticOperation) {
    return (
      <S.Container>
        <TrackPage
          category="Celo Activate"
          name="Step Confirmed"
          flow="stake"
          action="activate"
          currency="celo"
        />
        <SuccessDisplay
          title={<Trans i18nKey="celo.activate.steps.confirmation.success.title" />}
          description={multiline(t("celo.activate.steps.confirmation.success.text"))}
        />
      </S.Container>
    );
  }
  if (error) {
    return (
      <S.Container shouldSpace={signed}>
        <TrackPage
          category="Celo Activate"
          name="Step Confirmation Error"
          flow="stake"
          action="activate"
          currency="celo"
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="celo.activate.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </S.Container>
    );
  }
  return null;
};
export default StepConfirmation;
