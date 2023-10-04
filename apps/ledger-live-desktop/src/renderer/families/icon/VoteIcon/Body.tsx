// @flow
import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";

import { UserRefusedOnDevice } from "@ledgerhq/errors";

import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";

import type { StepId, StepProps, St } from "./types";
import { AccountBridge, Operation, Account, AccountLike } from "@ledgerhq/types-live";
import type { TFunction } from "i18next";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";

import { getCurrentDevice } from "~/renderer/reducers/devices";
import { closeModal, openModal, OpenModal } from "~/renderer/actions/modals";

import Stepper from "~/renderer/components/Stepper";
import StepVote, { StepVoteFooter } from "./steps/StepVote";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";

export type Data = {
  account: AccountLike | null | undefined;
  parentAccount: Account | null | undefined;
  reward?: number;
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
  accounts: Account[];
  device: Device | undefined | null;
  openModal: OpenModal;
  closeModal: () => void;
};

type Props = OwnProps & StateProps;

const steps: Array<St> = [
  {
    id: "castVotes",
    label: <Trans i18nKey="vote.steps.castVotes.title" />,
    component: StepVote,
    noScroll: true,
    footer: StepVoteFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="vote.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("castVotes"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="vote.steps.confirmation.title" />,
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

const Body = ({ t, stepId, device, onClose, openModal, onChangeStepId, params }: Props) => {
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const dispatch = useDispatch();
  const { account, source } = params;
  const {
    transaction,
    setTransaction,
    updateTransaction,
    parentAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction(() => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, undefined);
    const transaction = bridge.updateTransaction(bridge.createTransaction(account), {
      mode: "vote",
    });
    return {
      account,
      parentAccount: undefined,
      transaction,
    };
  });

  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);

  const handleRetry = useCallback(() => {
    onChangeStepId("castVotes");
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

  const iconResources = account && account.type === "Account" && source;
  const votes = iconResources && iconResources.votes;

  const stepperProps = {
    title: votes && votes.length > 0 ? t("vote.titleExisting") : t("vote.title"),
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
    reward: params.reward,
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
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalVote" />
    </Stepper>
  );
};

const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
