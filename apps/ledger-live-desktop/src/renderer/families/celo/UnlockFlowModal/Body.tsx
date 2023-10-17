import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";

import Stepper from "~/renderer/components/Stepper";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { StepId, StepProps, St } from "./types";
import { Account, Operation, SubAccount } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";

export type Data = {
  account: CeloAccount | SubAccount;
  parentAccount: CeloAccount | undefined | null;
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
const steps: Array<St> = [
  {
    id: "amount",
    label: <Trans i18nKey="celo.unlock.steps.amount.title" />,
    component: StepAmount,
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="celo.unlock.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="celo.unlock.steps.confirmation.title" />,
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
  const {
    transaction,
    setTransaction,
    account,
    parentAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction(() => {
    const { account, parentAccount } = params;
    const bridge = getAccountBridge(account, parentAccount);
    const t = bridge.createTransaction(account);
    const transaction = bridge.updateTransaction(t, {
      mode: "unlock",
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
    onChangeStepId("amount");
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
  const stepperProps = {
    title: t("celo.unlock.title"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps: [],
    disabledSteps: [],
    hideBreadcrumb: !!error,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose,
    error,
    status,
    optimisticOperation,
    openModal,
    setSigned,
    onChangeTransaction: setTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    t,
    bridgePending,
  };
  return (
    <Stepper {...stepperProps}>
      <Track onUnmount event="CloseModalUnlock" />
    </Stepper>
  );
};
const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
