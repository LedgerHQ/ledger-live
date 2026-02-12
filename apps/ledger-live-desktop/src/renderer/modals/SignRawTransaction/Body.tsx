import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import logger from "~/renderer/logger";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { ModalData } from "../types";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import { St, StepId } from "./types";

function useSteps(): St[] {
  const { t } = useTranslation();
  return useMemo(() => {
    const steps: St[] = [
      {
        id: "summary",
        label: t("send.steps.reviewSummary.title"),
        component: StepSummary,
        footer: StepSummaryFooter,
      },
      {
        id: "device",
        label: t("send.steps.connectLedger.title"),
        component: StepConnectDevice,
        onBack: ({ transitionTo }) => transitionTo("summary"),
      },
      {
        id: "confirmation",
        label: t("send.steps.confirmation.title"),
        excludeFromBreadcrumb: true,
        component: StepConfirmation,
        footer: StepConfirmationFooter,
        onBack: ({ transitionTo, onRetry }) => {
          onRetry();
          transitionTo("summary");
        },
      },
    ];
    return steps;
  }, [t]);
}

export type Params = {
  useApp?: string;
  dependencies?: string[];
  account: AccountLike;
  transaction: string;
  broadcast?: boolean;
  onResult: (signedOperation: SignedOperation) => void;
  onCancel: (error: Error) => void;
  parentAccount: Account | undefined | null;
  recipient?: string;
  amount?: BigNumber;
  manifestId?: string;
  manifestName?: string;
  location?: HOOKS_TRACKING_LOCATIONS;
};

type Props = {
  stepId: StepId;
  onChangeStepId: (a: StepId) => void;
  onClose: () => void;
  params: Params;
  setError: (error?: Error) => void;
};
export default function Body({ onChangeStepId, onClose, setError, params, stepId }: Props) {
  const { t } = useTranslation();
  const device = useSelector(getCurrentDevice);
  const dispatch = useDispatch();
  const {
    account,
    parentAccount,
    transaction,
    broadcast,
    manifestId,
    manifestName,
    useApp,
    dependencies,
  } = params;

  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const handleOpenModal = useCallback(
    <Name extends keyof ModalData>(name: Name, data: ModalData[Name]) =>
      dispatch(openModal(name, data)),
    [dispatch],
  );
  const handleCloseModal = useCallback(() => {
    dispatch(closeModal("MODAL_SIGN_RAW_TRANSACTION"));
  }, [dispatch]);
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    setError(undefined);
  }, [setError]);
  const handleTransactionError = useCallback(
    (error: Error) => {
      if (!(error instanceof UserRefusedOnDevice)) {
        logger.critical(error);
      }
      setTransactionError(error);
      setError(error);
    },
    [setError],
  );
  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);
  const handleTransactionSigned = useCallback(
    (signedTransaction: SignedOperation) => {
      params.onResult(signedTransaction);
      handleCloseModal();
    },
    [handleCloseModal, params],
  );

  const steps = useSteps();
  const errorSteps = useMemo(() => {
    return transactionError ? [steps.length - 2] : [];
  }, [steps.length, transactionError]);

  return (
    <Stepper
      stepId={stepId}
      title={t("sign.title")}
      manifestId={manifestId}
      manifestName={manifestName}
      useApp={useApp}
      dependencies={dependencies}
      broadcast={broadcast}
      steps={steps}
      errorSteps={errorSteps}
      device={device}
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      hideBreadcrumb={(!!transactionError && ["amount"].includes(stepId)) || stepId === "warning"}
      error={transactionError}
      location={params.location}
      openModal={handleOpenModal}
      onClose={onClose}
      closeModal={handleCloseModal}
      onRetry={handleRetry}
      onStepChange={handleStepChange}
      onTransactionSigned={handleTransactionSigned}
      onTransactionError={handleTransactionError}
    >
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalSignTransaction" />
    </Stepper>
  );
}
