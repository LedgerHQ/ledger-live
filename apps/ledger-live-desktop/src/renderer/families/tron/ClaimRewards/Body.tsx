import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { Trans, withTranslation, TFunction } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { StepId, StepProps, St } from "./types";
import { Account, Operation } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import StepRewards, { StepRewardsFooter } from "./steps/StepRewards";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
type OwnProps = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: {
    account: Account;
    parentAccount: Account | undefined | null;
    reward: number;
  };
  name: string;
};
type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  accounts: Account[];
  device: Device | undefined | null;
  closeModal: (a: string) => void;
  openModal: (a: string) => void;
};
type Props = OwnProps & StateProps;
const steps: Array<St> = [
  {
    id: "rewards",
    label: <Trans i18nKey="claimReward.steps.rewards.title" />,
    component: StepRewards,
    footer: StepRewardsFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="claimReward.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("rewards"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="claimReward.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];
const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
});
const mapDispatchToProps = {
  closeModal,
  openModal,
};
const Body = ({
  t,
  stepId,
  device,
  closeModal,
  openModal,
  onChangeStepId,
  params,
  name,
}: Props) => {
  const [optimisticOperation, setOptimisticOperation] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
  const [signed, setSigned] = useState(false);
  const dispatch = useDispatch();
  const { transaction, account, parentAccount, status, bridgeError } = useBridgeTransaction(() => {
    const { account, parentAccount } = params;
    const bridge = getAccountBridge(account, parentAccount);
    const t = bridge.createTransaction(account);
    const transaction = bridge.updateTransaction(t, {
      mode: "claimReward",
    });
    return {
      account,
      parentAccount,
      transaction,
    };
  });
  const handleCloseModal = useCallback(() => {
    closeModal(name);
  }, [closeModal, name]);
  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    onChangeStepId("rewards");
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
    title: t("claimReward.title"),
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
    onClose: handleCloseModal,
    reward: params.reward,
    error,
    status,
    optimisticOperation,
    openModal,
    setSigned,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalUnFreeze" />
    </Stepper>
  );
};
const C: React$ComponentType<OwnProps> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
