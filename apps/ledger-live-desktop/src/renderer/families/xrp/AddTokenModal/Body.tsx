import invariant from "invariant";
import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { useDispatch } from "LLD/hooks/redux";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { Track } from "@shared/analytics-react";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { StepProps, StepId, AddTokenStep } from "./types";
import { Account, Operation } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";

import Stepper from "~/renderer/components/Stepper";
import StepToken, { StepTokenFooter } from "./steps/StepToken";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { Transaction as XrpTransaction } from "@ledgerhq/live-common/families/xrp/types";

export type Data = {
  account: Account;
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
  accounts: Account[];
  openModal: OpenModal;
};

type Props = OwnProps & StateProps;

const steps: Array<AddTokenStep> = [
  {
    id: "token",
    label: <Trans i18nKey="xrp.addToken.steps.token.title" />,
    component: StepToken,
    noScroll: true,
    footer: StepTokenFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="xrp.addToken.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: (props: StepProps) => props.transitionTo("token"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="xrp.addToken.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

const mapStateToProps = createStructuredSelector({ device: getCurrentDevice });

const mapDispatchToProps = { openModal };

function Body({ t, stepId, device, onClose, openModal, onChangeStepId, params }: Props) {
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);

  const dispatch = useDispatch();
  const bridge = useAccountBridge<XrpTransaction>(params.account, undefined);

  const {
    transaction,
    setTransaction,
    updateTransaction,
    account,
    parentAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction(bridge, () => {
    invariant(params.account, "xrp: account required");

    const baseTransaction = bridge.createTransaction(params.account);
    const transaction = bridge.updateTransaction(baseTransaction, { mode: "changeTrust" });

    return { transaction, account: params.account, parentAccount: undefined };
  });

  const handleStepChange = useCallback(
    (step: AddTokenStep) => onChangeStepId(step.id),
    [onChangeStepId],
  );

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("token");
  }, [onChangeStepId]);

  const handleTransactionError = useCallback((error: Error) => {
    if (error?.name !== "UserRefusedOnDevice") {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);

  const handleOperationBroadcasted = useCallback(
    (optimisticOperation: Operation) => {
      if (!account) return;

      dispatch(
        updateAccountWithUpdater(account.id, storedAccount => {
          return addPendingOperation(storedAccount, optimisticOperation);
        }),
      );
      setOptimisticOperation(optimisticOperation);
      setTransactionError(null);
    },
    [account, dispatch],
  );

  const error = transactionError || bridgeError || status.errors.amount;
  const warning = status.warnings ? Object.values(status.warnings)[0] : null;

  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }

  const stepperProps = {
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    onClose,
    error,
    warning,
    status,
    optimisticOperation,
    openModal,
    setSigned,
    t,
    bridgePending,
    title: t("xrp.addToken.title"),
    disabledSteps: [],
    hideBreadcrumb: !!error || !!warning,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onChangeTransaction: setTransaction,
    onUpdateTransaction: updateTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalOptIn" />
    </Stepper>
  );
}

export default compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
