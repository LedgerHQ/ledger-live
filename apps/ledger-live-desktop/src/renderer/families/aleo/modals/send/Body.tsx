import React, { useCallback, useEffect, useState } from "react";
import { BigNumber } from "bignumber.js";
import { Trans, useTranslation } from "react-i18next";
import invariant from "invariant";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import {
  addPendingOperation,
  getMainAccount,
  getRecentAddressesStore,
} from "@ledgerhq/live-common/account/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import logger from "~/renderer/logger";
import Stepper from "~/renderer/components/Stepper";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import Track from "~/renderer/analytics/Track";
import type { ModalData } from "~/renderer/modals/types";
import StepConnectDevice from "~/renderer/modals/Send/steps/StepConnectDevice";
import StepSummary, { StepSummaryFooter } from "~/renderer/modals/Send/steps/StepSummary";
import StepConfirmation, {
  StepConfirmationFooter,
} from "~/renderer/modals/Send/steps/StepConfirmation";
import StepAmount, { StepAmountFooter } from "~/renderer/modals/Send/steps/StepAmount";
import StepRecipient from "./steps/StepRecipient";
import StepRecipientFooter from "./steps/StepRecipientFooter";
import StepMandatoryPrivateSync from "./steps/StepMandatoryPrivateSync";
import StepRecordPicker from "./steps/StepRecordPicker";
import StepRecordPickerFooter from "./steps/StepRecordPickerFooter";
import type { St, StepId } from "./types";

const steps: St[] = [
  {
    id: "recipient",
    label: <Trans i18nKey="send.steps.recipient.title" />,
    component: StepRecipient,
    footer: StepRecipientFooter,
    onBack: null,
  },
  {
    id: "private-sync",
    excludeFromBreadcrumb: true,
    component: StepMandatoryPrivateSync,
    onBack: ({ transitionTo }) => transitionTo("recipient"),
  },
  {
    id: "record-picker",
    excludeFromBreadcrumb: true,
    component: StepRecordPicker,
    footer: StepRecordPickerFooter,
    onBack: ({ transitionTo }) => transitionTo("recipient"),
  },
  {
    id: "amount",
    label: <Trans i18nKey="send.steps.amount.title" />,
    component: StepAmount,
    footer: StepAmountFooter,
    onBack: ({ transitionTo, transaction }) => {
      if (transaction?.family !== "aleo") return null;
      const targetStep = isPrivateTransaction(transaction) ? "record-picker" : "recipient";
      transitionTo(targetStep);
    },
  },
  {
    id: "summary",
    label: <Trans i18nKey="send.steps.summary.title" />,
    component: StepSummary,
    footer: StepSummaryFooter,
    onBack: ({ transitionTo }) => transitionTo("amount"),
  },
  {
    id: "device",
    label: <Trans i18nKey="send.steps.device.title" />,
    component: StepConnectDevice,
    onBack: ({ transitionTo }) => transitionTo("summary"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="send.steps.confirmation.title" />,
    excludeFromBreadcrumb: true,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
    onBack: null,
  },
];

type OwnProps = {
  title: string;
  modalName: keyof ModalData;
  stepId: StepId;
  onChangeStepId: (id: StepId) => void;
  onClose?: () => void;
  params: {
    account?: AccountLike | null;
    parentAccount?: Account | null;
    transaction?: Transaction;
    recipient?: string;
    amount?: BigNumber;
  };
};

const AleoSendBody = ({ title, modalName, stepId, onChangeStepId, onClose, params }: OwnProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const accounts = useSelector(accountsSelector);

  const [maybeAmount, setMaybeAmount] = useState<BigNumber | null>(() => params.amount ?? null);
  const [maybeRecipient, setMaybeRecipient] = useState<string | null>(
    () => params.recipient ?? null,
  );
  const onResetMaybeAmount = useCallback(() => setMaybeAmount(null), []);
  const onResetMaybeRecipient = useCallback(() => setMaybeRecipient(null), []);

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
  } = useBridgeTransaction(() => ({
    account: params?.account ?? accounts[0],
    parentAccount: params?.parentAccount,
    transaction: params.transaction,
  }));

  invariant(account, "account required");

  // Apply pre-filled recipient / amount when the body mounts with deeplink data
  useEffect(() => {
    if (!transaction) return;

    const bridge = getAccountBridge(account, parentAccount);
    let updatedTransaction = transaction;
    let hasChanges = false;

    if (maybeRecipient && !transaction.recipient) {
      updatedTransaction = bridge.updateTransaction(updatedTransaction, {
        recipient: maybeRecipient,
      });
      hasChanges = true;
      onResetMaybeRecipient();
    }

    if (maybeAmount && !maybeAmount.eq(transaction.amount ?? new BigNumber(0))) {
      updatedTransaction = bridge.updateTransaction(updatedTransaction, { amount: maybeAmount });
      hasChanges = true;
      onResetMaybeAmount();
    }

    if (hasChanges) {
      setTransaction(updatedTransaction);
    }
  }, [
    maybeRecipient,
    maybeAmount,
    transaction,
    account,
    parentAccount,
    setTransaction,
    onResetMaybeRecipient,
    onResetMaybeAmount,
  ]);

  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);

  const currency = account ? getAccountCurrency(account) : undefined;
  const currencyName = currency?.name;

  const handleCloseModal = useCallback(() => {
    dispatch(closeModal(modalName));
  }, [modalName, dispatch]);

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
      dispatch(
        updateAccountWithUpdater(mainAccount.id, acc =>
          addPendingOperation(acc, optimisticOperation),
        ),
      );
      setOptimisticOperation(optimisticOperation);
      setTransactionError(null);
      if (transaction && mainAccount) {
        const store = getRecentAddressesStore();
        const ensName = transaction.recipientDomain?.domain;
        store.addAddress(mainAccount.currency.id, transaction.recipient, ensName);
      }
    },
    [account, parentAccount, dispatch, transaction],
  );

  const handleStepChange = useCallback(
    (e: { id: StepId }) => onChangeStepId(e.id),
    [onChangeStepId],
  );

  const handleOpenModal = useCallback(
    // @ts-expect-error - temporary
    (name: string, data: unknown) => dispatch(openModal(name, data)),
    // unsafeOpenModal is a stable module-level reference — no need to include in deps
    [dispatch],
  );

  const errorSteps: number[] = [];
  if (transactionError) {
    errorSteps.push(3);
  } else if (bridgeError) {
    errorSteps.push(0);
  }

  const error = transactionError || bridgeError;

  if (!status) return null;

  const stepperProps = {
    t,
    stepId,
    steps,
    errorSteps,
    device,
    openedFromAccount: !!params.account,
    account,
    parentAccount,
    transaction,
    signed,
    currencyName,
    hideBreadcrumb: !!error && ["recipient", "amount"].includes(stepId),
    error,
    status,
    bridgePending,
    optimisticOperation,
    openModal: handleOpenModal,
    onClose,
    setSigned,
    closeModal: handleCloseModal,
    onChangeAccount: handleChangeAccount,
    onChangeTransaction: setTransaction,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    maybeAmount,
    onResetMaybeAmount,
    maybeRecipient,
    onResetMaybeRecipient,
    updateTransaction,
    title,
    modalName,
  };

  return (
    <Stepper {...stepperProps}>
      {stepId === "confirmation" ? null : <SyncSkipUnderPriority priority={100} />}
      <Track onUnmount event="CloseModalSend" />
    </Stepper>
  );
};

export default AleoSendBody;
