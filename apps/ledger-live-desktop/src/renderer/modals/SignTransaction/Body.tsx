import React, { useCallback, useState, useMemo, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
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
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { ModalData } from "../types";
import {
  DeviceTransactionField,
  getDeviceTransactionConfig,
} from "@ledgerhq/live-common/transaction/index";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

export type Params = {
  canEditFees: boolean;
  stepId?: StepId;
  useApp?: string;
  dependencies?: string[];
  account: AccountLike;
  transactionData: Partial<Transaction>;
  onResult: (signedOperation: SignedOperation) => void;
  onCancel: (error: Error) => void;
  parentAccount: Account | undefined | null;
  startWithWarning?: boolean;
  recipient?: string;
  amount?: BigNumber;
  manifestId?: string;
  manifestName?: string;
  isACRE?: boolean;
  location?: HOOKS_TRACKING_LOCATIONS;
};

type Props = {
  stepId: StepId;
  onChangeStepId: (a: StepId) => void;
  onClose: () => void;
  params: Params;
  setError: (error?: Error) => void;
};
function useSteps(canEditFees = false): St[] {
  const { t } = useTranslation();
  return useMemo(() => {
    const steps: St[] = [
      {
        id: "summary",
        label: t("send.steps.reviewSummary.title"),
        component: StepSummary,
        footer: StepSummaryFooter,
        onBack: canEditFees ? ({ transitionTo }) => transitionTo("amount") : null,
        backButtonComponent: canEditFees ? (
          <Text ff="Inter|Bold" fontSize={4} color="palette.primary.main">
            {t("common.adjustFees")}
          </Text>
        ) : undefined,
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
    return canEditFees
      ? [
          {
            id: "amount",
            label: t("send.steps.networkFee.title"),
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
function getStatusError(status: TransactionStatus, type = "errors"): Error | undefined | null {
  if (!status || !status[type as keyof TransactionStatus]) return null;
  const firstKey = Object.keys(status[type as keyof TransactionStatus]!).find(
    k => !STATUS_KEYS_IGNORE.includes(k),
  );
  // @ts-expect-error This is complicated to prove that type / firstKey are the right keys
  return firstKey ? status[type][firstKey] : null;
}
export default function Body({ onChangeStepId, onClose, setError, stepId, params }: Props) {
  useEffect(() => {
    // Check for stepId params on first mount to update if diff
    if (params.stepId && stepId !== params.stepId) {
      onChangeStepId(params.stepId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const device = useSelector(getCurrentDevice);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { canEditFees, transactionData } = params;
  const openedFromAccount = !!params.account;
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
    const transaction = bridge.updateTransaction(tx2, txData);
    return {
      account,
      parentAccount,
      transaction,
    };
  });
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const handleOpenModal = useCallback(
    <Name extends keyof ModalData>(name: Name, data: ModalData[Name]) =>
      dispatch(openModal(name, data)),
    [dispatch],
  );
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
  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);
  const handleTransactionSigned = useCallback(
    (signedTransaction: SignedOperation) => {
      params.onResult(signedTransaction);
      handleCloseModal();
    },
    [handleCloseModal, params],
  );
  const errorSteps = [];

  const fields = getDeviceTransactionConfig({
    account: params.account,
    parentAccount,
    transaction,
    status,
  });

  const typeTransaction: string = useMemo(
    () =>
      (
        fields.find(
          (field: { label: string }) => field.label && field.label === "Type",
        ) as DeviceTransactionField & { value: string }
      )?.value || "",
    [fields],
  );

  const steps = useSteps(canEditFees);

  if (transactionError) {
    errorSteps.push(steps.length - 2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }

  const title = typeTransaction === "Approve" ? t("approve.title") : t("sign.title");

  const error = transactionError || bridgeError || getStatusError(status, "errors");
  const warning = getStatusError(status, "warnings");
  const stepperProps = {
    title,
    stepId,
    isACRE: params.isACRE,
    manifestId: params.manifestId,
    manifestName: params.manifestName,
    useApp: params.useApp,
    dependencies: params.dependencies,
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
    location: params.location,
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
