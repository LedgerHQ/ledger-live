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
import { STAKE_METHOD, STAKE_TYPE } from "@ledgerhq/live-common/families/hedera/types";

import logger from "~/renderer/logger";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import { getCurrentDevice } from "~/renderer/reducers/devices";

import Stepper from "~/renderer/components/Stepper";

import StepStakingStarted, { StepStakingStartedFooter } from "./steps/StepStakingStarted";
import StepStakingInfo, { StepStakingInfoFooter } from "./steps/StepStakingInfo";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepSuccess, { StepSuccessFooter } from "./steps/StepSuccess";

import type { TFunction } from "react-i18next";
import type { Transaction, StakeType } from "@ledgerhq/live-common/families/hedera/types";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Option } from "~/renderer/components/Select";
import type { StepId, StepProps, St } from "./types";

type OwnProps = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: {
    account: Account,
    stakeType: StakeType,
    nodeListOptions: Option[],
  };
  name: string;
};

type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  accounts: Account[],
  device: Device | undefined | null;
  closeModal: (a: string) => void;
  openModal: (a: string) => void;
};

type Props = OwnProps & StateProps;

const steps: Array<St> = [
  {
    id: "started",
    label: <Trans i18nKey="hedera.stake.stepperHeader.started" />,
    component: StepStakingStarted,
    footer: StepStakingStartedFooter,
  },
  {
    id: "stake",
    label: <Trans i18nKey="hedera.stake.stepperHeader.stake" />,
    component: StepStakingInfo,
    footer: StepStakingInfoFooter,
    onBack: ({ transitionTo }: StepProps) => transitionTo("started"),
  },
  {
    id: "summary",
    label: <Trans i18nKey="hedera.stake.stepperHeader.summary" />,
    component: StepSummary,
    footer: StepSummaryFooter,
    onBack: ({ transitionTo }: StepProps) => transitionTo("stake"),
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="hedera.stake.stepperHeader.connectDevice" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("summary"),
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
  const dispatch = useDispatch();
  const [optimisticOperation, setOptimisticOperation] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
  const [signed, setSigned] = useState(false);
  const [continueClicked, setContinueClicked] = useState(false,);
  const [stakeMethod, setStakeMethod] = useState(
    STAKE_METHOD.NODE,
  );

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

    const t: Transaction = bridge.createTransaction(account);

    let transaction = bridge.updateTransaction(t, {
      mode: "stake",
      staked: { ...t.staked, stakeMethod: STAKE_METHOD.UNSELECTED, stakeType },
    });

    // account should have staking info in its `hederaResources`; set and update into `transaction`
    if (stakeType === STAKE_TYPE.CHANGE) {
      transaction = bridge.updateTransaction(transaction, {
        staked: { ...transaction.staked, ...account.hederaResources.staked },
      });
    }

    return { account, parentAccount: undefined, transaction };
  });

  const handleCloseModal = useCallback(() => closeModal(name), [closeModal, name]);

  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("stake");
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
    title: t("hedera.stake.stepperHeader.stake"),
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
    continueClicked,
    setContinueClicked,
    openModal,
    setSigned,
    onChangeTransaction: setTransaction,
    onUpdateTransaction: updateTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    t,
    bridgePending,
    nodeListOptions: params.nodeListOptions,
    stakeType: params.stakeType,
    name,
    stakeMethod,
    setStakeMethod,
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalStake" />
    </Stepper>
  );
};

const C: React$ComponentType<OwnProps> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);

export default C;