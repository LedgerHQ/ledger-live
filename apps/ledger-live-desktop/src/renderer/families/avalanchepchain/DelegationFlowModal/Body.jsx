// @flow
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/families/avalanchepchain/types";
import type { AccountBridge, Operation, Account } from "@ledgerhq/live-common/types";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { Trans, withTranslation } from "react-i18next";
import { connect, useDispatch } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { FIGMENT_AVALANCHE_VALIDATOR_NODES } from "@ledgerhq/live-common/families/avalanchepchain/utils";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import StepDelegation, { StepDelegationFooter } from "./steps/StepDelegation";
import StepEndDate, { StepEndDateFooter } from "./steps/StepEndDate";
import type { St, StepProps } from "./types";
import logger from "~/renderer/logger";

type OwnProps = {|
  stepId: StepId,
  onClose: () => void,
  onChangeStepId: StepId => void,
  params: {
    account: Account,
    parentAccount: ?Account,
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
    id: "validator",
    label: <Trans i18nKey="avalanchepchain.delegation.flow.steps.validator.title" />,
    component: StepDelegation,
    noScroll: true,
    footer: StepDelegationFooter,
  },
  {
    id: "amount",
    label: <Trans i18nKey="avalanchepchain.delegation.flow.steps.amount.title" />,
    component: StepAmount,
    onBack: ({ transitionTo }: StepProps) => transitionTo("validator"),
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "endDate",
    label: <Trans i18nKey="avalanchepchain.delegation.flow.steps.endDate.title" />,
    component: StepEndDate,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
    noScroll: true,
    footer: StepEndDateFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="avalanchepchain.delegation.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("endDate"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="avalanchepchain.delegation.flow.steps.confirmation.title" />,
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
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
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
    const { account } = params;

    invariant(
      account && account.avalanchePChainResources,
      "avalanche: account and avalanchePChainResources required",
    );

    const bridge: AccountBridge<Transaction> = getAccountBridge(account, undefined);

    const transaction = bridge.updateTransaction(bridge.createTransaction(account), {
      mode: "delegate",
      recipient: FIGMENT_AVALANCHE_VALIDATOR_NODES[0],
    });

    return { account, parentAccount: undefined, transaction };
  });

  const handleCloseModal = useCallback(() => {
    closeModal(name);
  }, [closeModal, name]);

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

  const error = transactionError || bridgeError;

  const errorSteps = [];

  if (transactionError) {
    const deviceStepIndex = 3;
    errorSteps.push(deviceStepIndex);
  } else if (bridgeError) {
    const validatorStepIndex = 0;
    errorSteps.push(validatorStepIndex);
  }

  const stepperProps = {
    title: t("avalanchepchain.delegation.flow.title"),
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
    onClose: handleCloseModal,
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
      <Track onUnmount event="CloseModalDelegation" />
    </Stepper>
  );
};

const C: React$ComponentType<OwnProps> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);

export default C;
