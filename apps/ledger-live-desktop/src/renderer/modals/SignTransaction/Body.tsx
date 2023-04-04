import React, { useCallback, useState, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { PlatformTransaction } from "@ledgerhq/live-common/platform/types";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import Stepper from "~/renderer/components/Stepper";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Track from "~/renderer/analytics/Track";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { St, StepId } from "./types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import logger from "~/renderer/logger";
import Text from "~/renderer/components/Text";
type Props = {
  stepId: StepId;
  onChangeStepId: (a: StepId) => void;
  onClose: () => void;
  params: {
    canEditFees: boolean;
    useApp?: string;
    account: AccountLike;
    transactionData: PlatformTransaction;
    onResult: (signedOperation: SignedOperation) => void;
    onCancel: (reason: any) => void;
    parentAccount: Account | undefined | null;
    startWithWarning?: boolean;
    recipient?: string;
    amount?: BigNumber;
  };
  setError: (error?: Error) => void;
};
function useSteps(canEditFees = false): St[] {
  const { t } = useTranslation();
  return useMemo(() => {
    const steps = [
      {
        id: "summary",
        label: t("send.steps.summary.title"),
        component: StepSummary,
        footer: StepSummaryFooter,
        onBack: canEditFees ? ({ transitionTo }) => transitionTo("amount") : null,
        backButtonComponent: canEditFees ? (
          <Text ff="Inter|Bold" fontSize={4} color="palette.primary.main">
            {t("common.adjustFees")}
          </Text>
        ) : (
          undefined
        ),
      },
      {
        id: "device",
        label: t("send.steps.device.title"),
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
    return canEditFees
      ? [
          {
            id: "amount",
            label: t("send.steps.amount.title"),
            component: StepAmount,
            footer: StepAmountFooter,
          },
          ...steps,
        ]
      : steps;
  }, [canEditFees, t]);
}
const STATUS_KEYS_IGNORE = ["recipient", "gasLimit"];

// returns the first error
function getStatusError(status, type = "errors"): Error | undefined | null {
  if (!status || !status[type]) return null;
  const firstKey = Object.keys(status[type]).find(k => !STATUS_KEYS_IGNORE.includes(k));
  return firstKey ? status[type][firstKey] : null;
}
export default function Body({ onChangeStepId, onClose, setError, stepId, params }: Props) {
  const device = useSelector(getCurrentDevice);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { canEditFees, transactionData } = params;
  const openedFromAccount = !!params.account;
  const steps = useSteps(canEditFees);
  const {
    transaction,
    setTransaction,
    updateTransaction,
    account,
    parentAccount,
    setAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction(() => {
    const parentAccount = params && params.parentAccount;
    const account = params && params.account;
    const bridge = getAccountBridge(account, parentAccount);
    const tx = bridge.createTransaction(account);
    const { recipient, ...txData } = transactionData;
    const tx2 = bridge.updateTransaction(tx, {
      recipient,
      subAccountId: isTokenAccount(account) ? account.id : undefined,
    });
    const transaction = bridge.updateTransaction(tx2, {
      userGasLimit: txData.gasLimit,
      ...txData,
    });
    return {
      account,
      parentAccount,
      transaction,
    };
  });
  const [transactionError, setTransactionError] = useState(null);
  const handleOpenModal = useCallback((name, data) => dispatch(openModal(name, data)), [dispatch]);
  const handleCloseModal = useCallback(() => {
    dispatch(closeModal("MODAL_SIGN_TRANSACTION"));
  }, [dispatch]);
  const handleChangeAccount = useCallback(
    (nextAccount: AccountLike, nextParentAccount?: Account | null) => {
      if (account !== nextAccount) {
        setAccount(nextAccount, nextParentAccount);
      }
    },
    [account, setAccount],
  );
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
  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);
  const handleTransactionSigned = useCallback(
    (signedTransaction: SignedOperation) => {
      params.onResult(signedTransaction);
      handleCloseModal();
    },
    [handleCloseModal, params],
  );
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(steps.length - 2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }
  const error = transactionError || bridgeError || getStatusError(status, "errors");
  const warning = getStatusError(status, "warnings");
  const stepperProps = {
    title: t("sign.title"),
    stepId,
    useApp: params.useApp,
    steps,
    errorSteps,
    device,
    openedFromAccount,
    account,
    parentAccount,
    transaction,
    hideBreadcrumb: (!!error && ["amount"].includes(stepId)) || stepId === "warning",
    error,
    warning,
    status,
    bridgePending,
    openModal: handleOpenModal,
    onClose,
    closeModal: handleCloseModal,
    onChangeAccount: handleChangeAccount,
    onChangeTransaction: setTransaction,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onTransactionSigned: handleTransactionSigned,
    onTransactionError: handleTransactionError,
    updateTransaction,
  };
  if (!status) return null;
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalSignTransaction" />
    </Stepper>
  );
}
