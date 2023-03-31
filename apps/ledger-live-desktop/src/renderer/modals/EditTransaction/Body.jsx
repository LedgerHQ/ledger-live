// @flow

import React, { useCallback, useState, memo } from "react";
import { BigNumber } from "bignumber.js";
import { connect } from "react-redux";
import { compose } from "redux";
import type { TFunction } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { Trans, withTranslation } from "react-i18next";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Account, AccountLike, Operation, TransactionCommonRaw } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { EIP1559ShouldBeUsed } from "@ledgerhq/live-common/families/ethereum/transaction";
import { isEditableOperation } from "@ledgerhq/live-common/operation";
import logger from "~/logger";
import Stepper from "~/renderer/components/Stepper";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import StepMethod, { StepMethodFooter } from "./steps/StepMethod";
import StepFees, { StepFeesFooter } from "./steps/StepFees";
import StepConnectDevice from "~/renderer/modals/Send/steps/StepConnectDevice";
import StepSummary, { StepSummaryFooter } from "~/renderer/modals/Send/steps/StepSummary";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import StepConfirmation, {
  StepConfirmationFooter,
} from "~/renderer/modals/Send/steps/StepConfirmation";
import type { St, StepId } from "./types";

type OwnProps = {|
  stepId: StepId,
  onChangeStepId: StepId => void,
  onClose: () => void,
  params: {
    account: ?AccountLike,
    parentAccount: ?Account,
    recipient?: string,
    amount?: BigNumber,
    disableBacks?: string[],
    transaction?: Transaction,
    onConfirmationHandler: Function,
    onFailHandler: Function,
    transactionRaw: TransactionCommonRaw,
    transactionSequenceNumber: number,
    isNftOperation: boolean,
  },
|};

type StateProps = {|
  t: TFunction,
  device: ?Device,
  accounts: Account[],
  closeModal: string => void,
  openModal: (string, any) => void,
  updateAccountWithUpdater: (string, (Account) => Account) => void,
  setIsNFTSend: boolean => void,
  isNFTSend: boolean,
|};

type Props = {|
  ...OwnProps,
  ...StateProps,
|};

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
  t,
  device,
  openModal,
  closeModal,
  onChangeStepId,
  onClose,
  stepId,
  params,
  accounts,
  updateAccountWithUpdater,
  setIsNFTSend,
  isNFTSend,
}: Props) => {
  const [steps] = useState(() => createSteps());

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
    return { account, parentAccount, transaction: fromTransactionRaw(params.transactionRaw) };
  });
  const [optimisticOperation, setOptimisticOperation] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
  const [signed, setSigned] = useState(false);

  const currency = account ? getAccountCurrency(account) : undefined;

  const currencyName = currency ? currency.name : undefined;

  const handleCloseModal = useCallback(() => {
    closeModal("MODAL_EDIT_TRANSACTION");
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
      if (!account) return;
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
  const feePerGas = new BigNumber(
    EIP1559ShouldBeUsed(mainAccount.currency)
      ? params.transactionRaw.maxFeePerGas
      : params.transactionRaw.gasPrice,
  );
  const feeValue = new BigNumber(
    params.transactionRaw.userGasLimit || params.transactionRaw.estimatedGasLimit,
  )
    .times(feePerGas)
    .div(new BigNumber(10).pow(mainAccount.unit.magnitude));
  const haveFundToCancel = mainAccount.balance.gt(feeValue.times(1.3));
  const haveFundToSpeedup = mainAccount.balance.gt(
    feeValue.times(1.1).plus(account.type === "Account" ? params.transactionRaw.amount : 0),
  );
  let isOldestEditableOperation = true;
  account.pendingOperations.forEach(operation => {
    if (isEditableOperation(account, operation)) {
      if (operation.transactionSequenceNumber < params.transactionSequenceNumber) {
        isOldestEditableOperation = false;
      }
    }
  });
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
    onConfirmationHandler: params.onConfirmationHandler,
    onFailHandler: params.onFailHandler,
    setEditType: handleSetEditType,
    editType,
    setIsNFTSend,
    isNFTSend,
    transactionRaw: params.transactionRaw,
    isNftOperation: params.isNftOperation,
    transactionSequenceNumber: params.transactionSequenceNumber,
    haveFundToSpeedup,
    haveFundToCancel,
    isOldestEditableOperation,
  };

  return (
    <Stepper {...stepperProps}>
      {stepId === "confirmation" ? null : <SyncSkipUnderPriority priority={100} />}
    </Stepper>
  );
};

const m: React$ComponentType<OwnProps> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(memo(Body));

export default m;
