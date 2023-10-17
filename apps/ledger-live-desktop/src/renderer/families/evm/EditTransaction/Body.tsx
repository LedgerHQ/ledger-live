import { getTransactionByHash } from "@ledgerhq/coin-evm/api/transaction/index";
import { fromTransactionRaw } from "@ledgerhq/coin-evm/transaction";
import { Transaction, TransactionRaw } from "@ledgerhq/coin-evm/types/index";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import {
  getEditTransactionStatus,
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
} from "@ledgerhq/live-common/families/evm/getUpdateTransactionPatch";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { isEditableOperation } from "@ledgerhq/live-common/operation";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { TFunction } from "i18next";
import invariant from "invariant";
import React, { useCallback, useEffect, useState } from "react";
import { Trans, withTranslation } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import logger from "~/renderer/logger";
import StepConfirmation, {
  StepConfirmationFooter,
} from "~/renderer/modals/Send/steps/StepConfirmation";
import StepConnectDevice from "~/renderer/modals/Send/steps/StepConnectDevice";
import StepSummary from "~/renderer/modals/Send/steps/StepSummary";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import StepFees, { StepFeesFooter } from "./steps/StepFees";
import StepMethod, { StepMethodFooter } from "./steps/StepMethod";
import { StepSummaryFooter } from "./steps/StepSummaryFooter";
import { St, StepId, StepProps } from "./types";

export type Params = {
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
  recipient?: string;
  amount?: BigNumber;
  transaction?: Transaction;
  transactionRaw: TransactionRaw;
  transactionHash: string;
};

type OwnProps = {
  stepId: StepId;
  params: Params;
  onChangeStepId: (a: StepId) => void;
  onClose?: () => void | undefined;
};

type StateProps = {
  device: Device | undefined | null;
  accounts: Account[];
  t: TFunction;
  closeModal: (a: string) => void;
  openModal: (b: string, a: unknown) => void;
  updateAccountWithUpdater: (b: string, a: (a: Account) => Account) => void;
};

type Props = OwnProps & StateProps;

/**
 * Method used to dynamically change the title of the stepper depending on the
 * editType selected
 */
const getStepTitleKey = (
  stepId: StepId,
  editType?: StepProps["editType"],
): "operation.edit.title" | "operation.edit.cancel.title" | "operation.edit.speedUp.title" => {
  if (!editType || stepId === "method") {
    return "operation.edit.title";
  }

  return editType === "cancel" ? "operation.edit.cancel.title" : "operation.edit.speedUp.title";
};

const createSteps = (): St[] => [
  {
    id: "method",
    label: <Trans i18nKey="operation.edit.steps.method.title" />,
    component: StepMethod,
    footer: StepMethodFooter,
  },
  {
    id: "fees",
    label: <Trans i18nKey="operation.edit.steps.fees.title" />,
    component: StepFees,
    footer: StepFeesFooter,
    onBack: ({ transitionTo }) => transitionTo("method"),
  },
  {
    id: "summary",
    label: <Trans i18nKey="operation.edit.steps.summary.title" />,
    component: StepSummary,
    footer: StepSummaryFooter,
    onBack: ({ transitionTo }) => transitionTo("fees"),
  },
  {
    id: "device",
    label: <Trans i18nKey="operation.edit.steps.device.title" />,
    component: StepConnectDevice,
    onBack: ({ transitionTo }) => transitionTo("summary"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="operation.edit.steps.confirmation.title" />,
    excludeFromBreadcrumb: true,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
    onBack: null,
  },
];

const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
  accounts: accountsSelector,
});

const mapDispatchToProps = {
  closeModal,
  openModal,
  updateAccountWithUpdater,
};

// Default interval to poll for transaction confirmation
// Arbitrarily set to 30 seconds
const DEFAULT_INTERVAL = 30 * 1000;

const Body = ({
  device,
  stepId,
  params,
  accounts,
  t,
  openModal,
  closeModal,
  onChangeStepId,
  onClose,
  updateAccountWithUpdater,
}: Props) => {
  const [steps] = useState(() => createSteps());
  const [transactionHasBeenValidated, setTransactionHasBeenValidated] = useState(false);

  const transactionToUpdate = fromTransactionRaw(params.transactionRaw);

  const {
    transaction,
    setTransaction,
    updateTransaction,
    account,
    parentAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction<Transaction>(() => {
    const parentAccount = params && params.parentAccount;
    const account = (params && params.account) || accounts[0];
    return {
      account,
      parentAccount,
      transaction: transactionToUpdate,
    };
  });

  invariant(account, "account required");
  invariant(transactionToUpdate, "transactionToUpdate required");
  invariant(transaction, "original transaction required");
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);

  const currencyName = getAccountCurrency(account).name;

  const handleCloseModal = useCallback(() => {
    closeModal("MODAL_EVM_EDIT_TRANSACTION");
  }, [closeModal]);

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    setOptimisticOperation(null);
    setSigned(false);
  }, []);

  const handleTransactionError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);

  const handleOperationBroadcasted = useCallback(
    (optimisticOperation: Operation) => {
      const mainAccount = getMainAccount(account, parentAccount);
      updateAccountWithUpdater(mainAccount.id, account =>
        addPendingOperation(account, optimisticOperation),
      );
      setOptimisticOperation(optimisticOperation);
      setTransactionError(null);
    },
    [account, parentAccount, updateAccountWithUpdater],
  );

  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);
  const error = transactionError || bridgeError;
  const mainAccount = getMainAccount(account, parentAccount);

  useEffect(() => {
    const setTransactionHasBeenValidatedCallback = async () => {
      const tx = await getTransactionByHash(mainAccount.currency, params.transactionHash);
      if (tx?.confirmations) {
        setTransactionHasBeenValidated(true);
        // stop polling as soon as we have a confirmation
        clearInterval(intervalId);
      }
    };

    setTransactionHasBeenValidatedCallback();
    const intervalId = setInterval(
      () => setTransactionHasBeenValidatedCallback(),
      mainAccount.currency.blockAvgTime
        ? mainAccount.currency.blockAvgTime * 1000
        : DEFAULT_INTERVAL,
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [mainAccount.currency, params.transactionHash]);

  const haveFundToCancel = hasMinimumFundsToCancel({ transactionToUpdate, mainAccount });
  const haveFundToSpeedup = hasMinimumFundsToSpeedUp({ transactionToUpdate, mainAccount, account });

  const isOldestEditableOperation = mainAccount.pendingOperations.reduce((isOldest, operation) => {
    if (isEditableOperation(account, operation)) {
      if (
        operation.transactionSequenceNumber !== undefined &&
        /* nonce is always defined in evm type as of today */
        transactionToUpdate.nonce !== undefined &&
        operation.transactionSequenceNumber < transactionToUpdate.nonce
      ) {
        return false;
      }
    }

    return isOldest;
  }, true);

  const [editType, setEditType] = useState<StepProps["editType"]>(
    isOldestEditableOperation && haveFundToSpeedup
      ? "speedup"
      : haveFundToCancel
      ? "cancel"
      : undefined,
  );
  const handleSetEditType = useCallback(editType => setEditType(editType), []);

  const updatedStatus = getEditTransactionStatus({
    editType,
    transaction,
    transactionToUpdate,
    status,
  });

  const stepperProps = {
    title: t(getStepTitleKey(stepId, editType)),
    stepId,
    steps,
    device,
    account,
    parentAccount,
    transaction,
    signed,
    currencyName,
    hideBreadcrumb: false,
    error,
    status: updatedStatus,
    bridgePending,
    optimisticOperation,
    editType,
    transactionHasBeenValidated,
    haveFundToSpeedup,
    haveFundToCancel,
    isOldestEditableOperation,
    transactionToUpdate,
    openModal,
    onClose,
    setSigned,
    closeModal: handleCloseModal,
    onChangeTransaction: setTransaction,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    updateTransaction,
    setEditType: handleSetEditType,
  };

  return (
    <Stepper {...stepperProps}>
      {stepId === "confirmation" ? null : <SyncSkipUnderPriority priority={100} />}
    </Stepper>
  );
};

const ModalBody = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body) as React.ComponentType<OwnProps>;

export default ModalBody;
