import {
  getEditTransactionStatus,
  type GetEditTransactionStatusParams,
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
  isTransactionConfirmed,
} from "@ledgerhq/coin-bitcoin/editTransaction/index";
import { getOriginalTxFeeRateSatVb } from "@ledgerhq/coin-bitcoin/rbfHelpers";
import { fromTransactionRaw } from "@ledgerhq/coin-bitcoin/transaction";
import {
  BitcoinAccount,
  Transaction,
  TransactionRaw,
  TransactionStatus,
} from "@ledgerhq/coin-bitcoin/types";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { isOldestBitcoinPendingOperation } from "@ledgerhq/live-common/operation";
import { getEnv } from "@ledgerhq/live-env";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import invariant from "invariant";
import React, { useCallback, useEffect, useState } from "react";
import type { BigNumber } from "bignumber.js";
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

type Params = {
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
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

export type Props = OwnProps & StateProps;

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
    account: accountFromBridge,
    parentAccount: parentAccountFromBridge,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction<Transaction>(() => {
    const parentAccount = params?.parentAccount;
    const account = params?.account || accounts[0];
    return {
      account,
      parentAccount,
      transaction: transactionToUpdate,
    };
  });

  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);

  const [account, setAccount] = useState<AccountLike | null | undefined>(accountFromBridge);
  const [parentAccount, setParentAccount] = useState<Account | null | undefined>(
    parentAccountFromBridge,
  );

  // Don't render until bridge is ready to avoid flashing previous screens
  // Use invariant for required values but allow rendering with bridgePending
  // (returning null causes useNavigate context issues in child components)
  invariant(account, "account required");
  invariant(transactionToUpdate, "transactionToUpdate required");
  invariant(transaction, "original transaction required");
  invariant(status, "transaction status required");

  const currencyName = getAccountCurrency(account).name;

  const handleCloseModal = useCallback(() => {
    closeModal("MODAL_BITCOIN_EDIT_TRANSACTION");
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

  const handleStepChange = useCallback((step: St) => onChangeStepId(step.id), [onChangeStepId]);
  const error = transactionError || bridgeError;
  const mainAccount = getMainAccount(account, parentAccount);

  useEffect(() => {
    const setTransactionHasBeenValidatedCallback = async () => {
      const walletAccount = (mainAccount as BitcoinAccount).bitcoinResources?.walletAccount;
      if (!walletAccount) return;
      const hasBeenConfirmed = await isTransactionConfirmed(walletAccount, params.transactionHash);

      if (hasBeenConfirmed) {
        // stop polling as soon as we have a confirmation
        clearInterval(intervalId);
        setTransactionHasBeenValidated(true);
      }
    };

    setTransactionHasBeenValidatedCallback();
    const intervalId = window.setInterval(
      () => setTransactionHasBeenValidatedCallback(),
      mainAccount.currency.blockAvgTime
        ? mainAccount.currency.blockAvgTime * 1000
        : getEnv("DEFAULT_TRANSACTION_POLLING_INTERVAL"),
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [mainAccount, mainAccount.currency, params.transactionHash]);

  const [haveFundToCancel, setHaveFundToCancel] = useState(false);
  const [haveFundToSpeedup, setHaveFundToSpeedup] = useState(false);
  const [originalFeePerByte, setOriginalFeePerByte] = useState<BigNumber | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchFunds = async () => {
      const [cancelFunds, speedupFunds] = await Promise.all([
        hasMinimumFundsToCancel({ mainAccount, transactionToUpdate }),
        hasMinimumFundsToSpeedUp({ mainAccount, transactionToUpdate }),
      ]);

      if (!cancelled) {
        setHaveFundToCancel(cancelFunds);
        setHaveFundToSpeedup(speedupFunds);
      }
    };

    fetchFunds();
    return () => {
      cancelled = true;
    };
  }, [mainAccount, transactionToUpdate]);

  // When transactionToUpdate.feePerByte is missing (e.g. not stored in operation), fetch original tx fee rate for RBF validation
  useEffect(() => {
    const replaceTxId = transactionToUpdate.replaceTxId;
    const hasFeePerByte =
      transactionToUpdate.feePerByte != null && !transactionToUpdate.feePerByte.isNaN();

    if (!replaceTxId || hasFeePerByte) {
      setOriginalFeePerByte(null);
      return;
    }

    let cancelled = false;
    getOriginalTxFeeRateSatVb(mainAccount, replaceTxId).then((fee: BigNumber | null) => {
      if (!cancelled) {
        setOriginalFeePerByte(fee);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mainAccount, transactionToUpdate.replaceTxId, transactionToUpdate.feePerByte]);

  // if we are at this step (i.e: in this screen) it means the transaction is editable
  const pendingOperation = mainAccount.pendingOperations.find(
    pendingOp => pendingOp.hash === params.transactionHash,
  );
  const isOldestEditableOperation = pendingOperation?.date
    ? isOldestBitcoinPendingOperation(mainAccount, pendingOperation.date)
    : false;

  const derivedEditType: StepProps["editType"] =
    isOldestEditableOperation && haveFundToSpeedup
      ? "speedup"
      : haveFundToCancel
        ? "cancel"
        : undefined;

  // Track if user has manually selected an edit type
  const [userSelectedEditType, setUserSelectedEditType] =
    useState<StepProps["editType"]>(undefined);

  // Use user selection if available, otherwise use derived value
  const editType = userSelectedEditType ?? derivedEditType;

  const handleSetEditType: StepProps["setEditType"] = useCallback(editType => {
    setUserSelectedEditType(editType);
  }, []);

  /**
   * In order to display the relevant information in the summary step, regarding
   * account and currency, depending on the editType selected,
   * we need to update the account and parentAccount provided to the StepSummary
   * component.
   * - When we do a speedup, the account is the same as the one used in the transaction
   * (whether it's an Account or TokenAccount)
   * - When we do a cancel, the account used is always the mainAccount, since a cancel
   * is sending 0 COIN_CURRENCY (for example ETH for ethereum) to yourself
   */
  useEffect(() => {
    if (editType === "speedup") {
      setAccount(accountFromBridge);
      setParentAccount(parentAccountFromBridge);
      return;
    }

    if (editType === "cancel") {
      setAccount(mainAccount);
      setParentAccount(undefined);
      return;
    }
    // We only want to update the account and parentAccount when the editType changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editType]);

  const statusParams: GetEditTransactionStatusParams = {
    editType,
    transaction,
    transactionToUpdate,
    status: status as TransactionStatus,
    ...(originalFeePerByte != null ? { originalFeePerByte } : {}),
  };
  const updatedStatus = getEditTransactionStatus(statusParams);

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
