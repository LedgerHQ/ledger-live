import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { useDispatch } from "LLD/hooks/redux";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { StepId, StepProps, St } from "./types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import Stepper from "~/renderer/components/Stepper";
import StepValidator, { StepValidatorFooter } from "./steps/StepValidator";
import StepWithdrawal, { StepWithdrawalFooter } from "./steps/StepWithdrawal";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { Account, Operation } from "@ledgerhq/types-live";

export type Data = {
  account: AleoAccount;
  parentAccount?: Account;
  source?: string;
};

type OwnProps = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: Data;
};

type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  openModal: OpenModal;
};

type Props = OwnProps & StateProps;

const steps: Array<St> = [
  {
    id: "validator",
    label: <Trans i18nKey="aleo.bond.flow.steps.validator.title" />,
    component: StepValidator,
    noScroll: true,
    footer: StepValidatorFooter,
  },
  {
    id: "withdrawal",
    label: <Trans i18nKey="aleo.bond.flow.steps.withdrawal.title" />,
    component: StepWithdrawal,
    onBack: ({ transitionTo }: StepProps) => transitionTo("validator"),
    noScroll: true,
    footer: StepWithdrawalFooter,
  },
  {
    id: "amount",
    label: <Trans i18nKey="aleo.bond.flow.steps.amount.title" />,
    component: StepAmount,
    onBack: ({ transitionTo }: StepProps) => transitionTo("withdrawal"),
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="aleo.bond.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="aleo.bond.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
});
const mapDispatchToProps = {
  openModal,
};

const Body = ({ t, stepId, device, onClose, openModal, onChangeStepId, params }: Props) => {
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const dispatch = useDispatch();
  const { account, parentAccount, source = "Account Page" } = params;
  const bridge = useAccountBridge<Transaction>(account, parentAccount);

  const { transaction, setTransaction, updateTransaction, status, bridgeError, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => {
      const mainAccount = getMainAccount(account, parentAccount);
      const t0 = bridge.createTransaction(account);
      const transaction = bridge.updateTransaction(t0, {
        mode: "bond_public",
        recipient: "",
        withdrawal: mainAccount.freshAddress,
      });
      return {
        account,
        parentAccount,
        transaction,
      };
    });

  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("validator");
  }, [onChangeStepId]);
  const handleTransactionError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);
  const handleOperationBroadcasted = useCallback(
    (optimisticOperation: Operation) => {
      if (!account) return;
      dispatch(
        updateAccountWithUpdater(account.id, account =>
          addPendingOperation(account, optimisticOperation),
        ),
      );
      setOptimisticOperation(optimisticOperation);
      setTransactionError(null);
    },
    [account, dispatch],
  );

  const error = transactionError || bridgeError;
  const errorSteps: number[] = [];
  if (transactionError) {
    errorSteps.push(stepId === "confirmation" ? 4 : 3);
  } else if (bridgeError) {
    errorSteps.push(0);
  }

  const stepperProps = {
    title: t("aleo.bond.flow.title"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && ["validator"].includes(stepId),
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose,
    error,
    status,
    optimisticOperation,
    openModal,
    setSigned,
    onChangeTransaction: setTransaction,
    onUpdateTransaction: updateTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    t,
    bridgePending,
    source,
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalBondPublic" />
    </Stepper>
  );
};

const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);

export default C;
