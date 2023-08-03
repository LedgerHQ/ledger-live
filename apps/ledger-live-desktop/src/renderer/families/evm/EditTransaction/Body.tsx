import { getEstimatedFees } from "@ledgerhq/coin-evm/logic";
import { fromTransactionRaw } from "@ledgerhq/coin-evm/transaction";
import { Transaction, TransactionRaw } from "@ledgerhq/coin-evm/types/index";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { isEditableOperation } from "@ledgerhq/live-common/operation";
import { getEnv } from "@ledgerhq/live-env";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { TFunction, Trans, withTranslation } from "react-i18next";
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
import { St, StepId } from "./types";

export type Data = {
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
  params: Data;
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
    onBack: ({ transitionTo, editType }) => {
      // transit to "fees" page for speedup flow and skip the "fees" page for cancel flow
      transitionTo(editType === "speedup" ? "fees" : "method");
    },
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
  } = useBridgeTransaction(() => {
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

  const feeValue = getEstimatedFees(transactionToUpdate);

  const haveFundToCancel = mainAccount.balance.gt(
    feeValue.times(1 + getEnv("EDIT_TX_EIP1559_MAXFEE_GAP_CANCEL_FACTOR")),
  );

  const haveFundToSpeedup = mainAccount.balance.gt(
    feeValue
      .times(1 + getEnv("EDIT_TX_EIP1559_FEE_GAP_SPEEDUP_FACTOR"))
      .plus(account.type === "Account" ? transactionToUpdate.amount : 0),
  );

  // log account and fees info
  logger.log(`main account address: ${mainAccount.freshAddress}`);
  logger.log(`main account balance: ${mainAccount.balance.toFixed()}`);
  logger.log(`feeValue: ${feeValue.toFixed()}`);
  logger.log(`pending transaction amount: ${transactionToUpdate.amount.toFixed()}`);

  let isOldestEditableOperation = true;
  mainAccount.pendingOperations.forEach((operation: Operation) => {
    if (isEditableOperation(account, operation)) {
      if (
        operation.transactionSequenceNumber !== undefined &&
        /* nonce is always defined in evm type as of today */
        transactionToUpdate.nonce !== undefined &&
        operation.transactionSequenceNumber < transactionToUpdate.nonce
      ) {
        isOldestEditableOperation = false;
      }
    }
  });

  // FIXME: should be enmu (or TS type) instead of string
  const [editType, setEditType] = useState(
    isOldestEditableOperation && haveFundToSpeedup ? "speedup" : haveFundToCancel ? "cancel" : "",
  );
  const handleSetEditType = useCallback(editType => setEditType(editType), []);

  const stepperProps = {
    title: t("operation.edit.title"),
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
    status,
    bridgePending,
    optimisticOperation,
    editType,
    transactionHash: params.transactionHash,
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
