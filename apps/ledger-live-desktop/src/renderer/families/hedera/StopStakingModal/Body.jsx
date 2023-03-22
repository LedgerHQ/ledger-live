// @flow

import invariant from "invariant";
import React, { useState, useCallback } from "react";
import { connect, useDispatch } from "react-redux";
import { compose } from "redux";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { UserRefusedOnDevice } from "@ledgerhq/errors";

import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import logger from "~/logger/logger";

import Stepper from "~/renderer/components/Stepper";

import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import StepConnectDevice from "../StakeModal/steps/StepConnectDevice";
import StepSuccess, { StepSuccessFooter } from "../StakeModal/steps/StepSuccess";

import type { TFunction } from "react-i18next";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { StakeType } from "@ledgerhq/live-common/families/hedera/types";
import type { StepId, St } from "./types";
import type { StepProps } from "../StakeModal/types";

type OwnProps = {|
  stepId: StepId,
  onChangeStepId: StepId => void,
  params: {
    account: Account,
    stakeType: StakeType,
  },
  name: string,
|};

type StateProps = {|
  t: TFunction,
  device: ?Device,
  accounts: Account[],
  device: ?Device,
  closeModal: string => void,
  openModal: string => void,
|};

type Props = OwnProps & StateProps;

const steps: Array<St> = [
  {
    id: "confirmation",
    label: <Trans i18nKey="hedera.stake.stepperHeader.confirmation" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="hedera.stake.stepperHeader.connectDevice" />,
    component: StepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("confirmation"),
  },
  {
    id: "success",
    label: <Trans i18nKey="hedera.stake.stepperHeader.success" />,
    component: StepSuccess,
    footer: StepSuccessFooter,
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
    const { account, stakeType }: { account: Account, stakeType: StakeType } = params;

    invariant(account && account.hederaResources, "hedera: account and hedera resources required");

    const bridge = getAccountBridge(account, undefined);

    const t = bridge.createTransaction(account);

    // update transaction to clear stake
    const transaction = bridge.updateTransaction(t, {
      mode: "stake",
      staked: {
        stakeType,
      },
    });

    return { account, parentAccount: undefined, transaction };
  });

  const handleCloseModal = useCallback(() => closeModal(name), [closeModal, name]);

  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("connectDevice");
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

  const error = transactionError || bridgeError || status.errors.amount;
  const warning = status.warnings ? Object.values(status.warnings)[0] : null;

  const errorSteps = [];

  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }

  const stepperProps = {
    title: t("hedera.stake.stepperHeader.stopStake"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: error || warning,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose: handleCloseModal,
    error,
    warning,
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
    stakeType: params.stakeType,
    name,
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalStopStaking" />
    </Stepper>
  );
};

const C: React$ComponentType<OwnProps> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);

export default C;