import invariant from "invariant";
import React, { useCallback, useState } from "react";
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
import { Account, Operation } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import type { StakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import { isStakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";

export type Data = {
  account: StakingAccount;
  validatorAddress: string;
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
  accounts: Account[];
  openModal: OpenModal;
};
type Props = OwnProps & StateProps;

const steps: Array<St> = [
  {
    id: "amount",
    label: <Trans i18nKey="ethereum.evmStaking.undelegation.flow.steps.amount.title" />,
    component: StepAmount,
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="ethereum.evmStaking.undelegation.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice as unknown as React.ComponentType<StepProps>,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="ethereum.evmStaking.undelegation.flow.steps.confirmation.title" />,
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

const Body = ({ onClose, t, stepId, device, openModal, onChangeStepId, params }: Props) => {
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const dispatch = useDispatch();
  const { account, validatorAddress, source = "Account Page" } = params;
  const bridge = useAccountBridge<EvmTransaction>(account, undefined);

  const {
    transaction,
    setTransaction,
    updateTransaction,
    parentAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction(bridge, () => {
    invariant(isStakingAccount(account), "evm: account with staking resources required");
    // Pre-populate the transaction with the existing delegation amount so the user starts
    // on a valid "undelegate all" intent. The amount field lets them reduce it afterwards.
    const delegation = account.stakingResources.delegations.find(
      d => d.validatorAddress === validatorAddress,
    );
    const baseTransaction = bridge.createTransaction(account);
    const transaction = bridge.updateTransaction(baseTransaction, {
      mode: "undelegate",
      valAddress: validatorAddress,
      recipient: account.freshAddress,
      amount: delegation?.amount,
      useAllAmount: false,
      valId: delegation?.validatorId,
    } as unknown as Partial<EvmTransaction>);
    return {
      account,
      parentAccount: undefined,
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
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }

  const stepperProps = {
    title: t("ethereum.evmStaking.undelegation.flow.title"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && ["amount"].includes(stepId),
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
    validatorAddress,
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalUndelegation" />
    </Stepper>
  );
};

const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);

export default C;
