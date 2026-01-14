import React, { useCallback, useEffect, useState } from "react";
import { BigNumber } from "bignumber.js";
import { connect } from "react-redux";
import { compose } from "redux";
import invariant from "invariant";
import { TFunction } from "i18next";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import {
  addPendingOperation,
  getMainAccount,
  getRecentAddressesStore,
} from "@ledgerhq/live-common/account/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import logger from "~/renderer/logger";
import Stepper from "~/renderer/components/Stepper";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Track from "~/renderer/analytics/Track";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import StepRecipient, { StepRecipientFooter } from "./steps/StepRecipient";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import StepWarning, { StepWarningFooter } from "./steps/StepWarning";
import { St, StepId } from "./types";

export type Data = {
  account?: AccountLike | undefined | null;
  parentAccount?: Account | undefined | null;
  startWithWarning?: boolean;
  recipient?: string;
  amount?: BigNumber;
  disableBacks?: string[];
  walletConnectProxy?: boolean;
  transaction?: Transaction;
  onConfirmationHandler?: () => void;
  onFailHandler?: () => void;
  stepId?: StepId;
};

type OwnProps = {
  stepId: StepId;
  onChangeStepId: (a: StepId) => void;
  onClose?: () => void | undefined;
  params: Data;
};
type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  accounts: Account[];
  closeModal: (a: string) => void;
  openModal: (b: string, a: unknown) => void;
  updateAccountWithUpdater: (b: string, a: (a: Account) => Account) => void;
};
type Props = {} & OwnProps & StateProps;
const createSteps = (disableBacks: string[] = []): St[] => {
  const steps: Array<St | undefined> = [
    {
      id: "warning",
      excludeFromBreadcrumb: true,
      component: StepWarning,
      footer: StepWarningFooter,
    },
    {
      id: "recipient",
      label: <Trans i18nKey="send.steps.recipient.title" />,
      component: StepRecipient,
      footer: StepRecipientFooter,
    },
    {
      id: "amount",
      label: <Trans i18nKey="send.steps.amount.title" />,
      component: StepAmount,
      footer: StepAmountFooter,
      onBack: !disableBacks.includes("amount")
        ? ({ transitionTo }) => transitionTo("recipient")
        : null,
    },
    {
      id: "summary",
      label: <Trans i18nKey="send.steps.summary.title" />,
      component: StepSummary,
      footer: StepSummaryFooter,
      onBack: !disableBacks.includes("transaction")
        ? ({ transitionTo }) => transitionTo("amount")
        : null,
    },
    {
      id: "device",
      label: <Trans i18nKey="send.steps.device.title" />,
      component: StepConnectDevice,
      onBack: !disableBacks.includes("device")
        ? ({ transitionTo }) => transitionTo("summary")
        : null,
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

  return steps.filter(Boolean) as St[];
};
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
}: Props) => {
  const openedFromAccount = !!params.account;

  const walletConnectProxy = !!params.walletConnectProxy;

  // initial values might coming from deeplink
  const [maybeAmount, setMaybeAmount] = useState(() => params.amount || null);
  const [maybeRecipient, setMaybeRecipient] = useState(() => params.recipient || null);
  const onResetMaybeAmount = useCallback(() => {
    setMaybeAmount(null);
  }, [setMaybeAmount]);
  const onResetMaybeRecipient = useCallback(() => {
    setMaybeRecipient(null);
  }, [setMaybeRecipient]);

  const [steps] = useState(() => createSteps(params.disableBacks));

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
    const parentAccount = params?.parentAccount;
    const account = params?.account || accounts[0];
    return {
      account,
      parentAccount,
      transaction: params.transaction,
    };
  });

  invariant(account, "account required");

  // make sure step id is in sync
  useEffect(() => {
    const stepId = params?.startWithWarning ? "warning" : null;
    if (stepId) onChangeStepId(stepId);
  }, [onChangeStepId, params]);

  // Apply pre-filled recipient and amount to transaction when skipping steps
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

    if (maybeAmount && !maybeAmount.eq(transaction.amount || new BigNumber(0))) {
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
  const currencyName = currency ? currency.name : undefined;
  const handleCloseModal = useCallback(() => {
    closeModal("MODAL_SEND");
  }, [closeModal]);
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
      updateAccountWithUpdater(mainAccount.id, account =>
        addPendingOperation(account, optimisticOperation),
      );
      setOptimisticOperation(optimisticOperation);
      setTransactionError(null);
      // Add address to recent addresses store after successful broadcast
      if (transaction && mainAccount) {
        const store = getRecentAddressesStore();
        const ensName = transaction.recipientDomain?.domain;
        store.addAddress(mainAccount.currency.id, transaction.recipient, ensName);
      }
    },
    [account, parentAccount, updateAccountWithUpdater, transaction],
  );
  const handleStepChange = useCallback(
    (e: { id: StepId }) => onChangeStepId(e.id),
    [onChangeStepId],
  );
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(3);
  } else if (bridgeError) {
    errorSteps.push(0);
  }
  const error = transactionError || bridgeError;
  const stepperProps = {
    title: stepId === "warning" ? t("common.information") : t("send.title"),
    stepId,
    steps,
    errorSteps,
    device,
    openedFromAccount,
    account,
    parentAccount,
    transaction,
    signed,
    currencyName,
    hideBreadcrumb: (!!error && ["recipient", "amount"].includes(stepId)) || stepId === "warning",
    error,
    status,
    bridgePending,
    optimisticOperation,
    openModal,
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
    walletConnectProxy,
    onConfirmationHandler: params.onConfirmationHandler,
    onFailHandler: params.onFailHandler,
  };

  if (!status) {
    return null;
  }

  return (
    <Stepper {...stepperProps}>
      {stepId === "confirmation" ? null : <SyncSkipUnderPriority priority={100} />}
      <Track onUnmount event="CloseModalSend" />
    </Stepper>
  );
};

const m = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body) as React.ComponentType<OwnProps>;
export default m;
