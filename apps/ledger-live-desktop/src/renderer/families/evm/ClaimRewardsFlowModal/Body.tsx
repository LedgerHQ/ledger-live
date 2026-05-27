import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import {
  isStakingAccount,
  StakingDelegation,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account, Operation } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import invariant from "invariant";
import { useDispatch } from "LLD/hooks/redux";
import React, { useCallback, useState } from "react";
import { Trans, withTranslation } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import logger from "~/renderer/logger";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import StepClaimRewards, { StepClaimRewardsFooter } from "./steps/StepClaimRewards";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { St, StepId, StepProps } from "./types";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";

export type Data = {
  account: Account;
  validatorAddress?: string | undefined | null;
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
    id: "claimRewards",
    label: <Trans i18nKey="cosmos.claimRewards.flow.steps.claimRewards.title" />,
    component: StepClaimRewards,
    noScroll: true,
    footer: StepClaimRewardsFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="cosmos.claimRewards.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice as unknown as React.ComponentType<StepProps>,
    onBack: ({ transitionTo }: StepProps) => transitionTo("claimRewards"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="cosmos.claimRewards.flow.steps.confirmation.title" />,
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

function getDelegationWithMaximumReward(delegations: StakingDelegation[]) {
  return delegations.reduce((maxDelegation, delegation) =>
    delegation.pendingRewards.minus(maxDelegation.pendingRewards).gt(0)
      ? delegation
      : maxDelegation,
  );
}

const Body = ({ t, stepId, device, onClose, openModal, onChangeStepId, params }: Props) => {
  invariant(isStakingAccount(params.account), "account must have delegations");

  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const dispatch = useDispatch();
  const bridge = useAccountBridge<GenericTransaction>(params.account, undefined);
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
    const { account, validatorAddress: validatorAddressFromParams } = params;
    invariant(isStakingAccount(account), "account must have delegations");

    const validatorAddress =
      validatorAddressFromParams ??
      getDelegationWithMaximumReward(account.stakingResources.delegations).validatorAddress;

    const t = bridge.createTransaction(account);
    const transaction = bridge.updateTransaction(t, {
      mode: "claimReward",
      valAddress: validatorAddress,
      recipient: account.freshAddress,
    }) as unknown as EvmTransaction;
    return {
      account,
      parentAccount: undefined,
      transaction,
    };
  });

  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("claimRewards");
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
  const error = transactionError || bridgeError || status.errors.amount || status.errors.fees;
  const warning = status.warnings ? Object.values(status.warnings)[0] : null;
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }
  const stepperProps = {
    account,
    bridgePending,
    device,
    disabledSteps: [],
    error,
    errorSteps,
    hideBreadcrumb: (!!error || !!warning) && ["claimRewards"].includes(stepId),
    onChangeTransaction: setTransaction,
    onClose,
    onOperationBroadcasted: handleOperationBroadcasted,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onTransactionError: handleTransactionError,
    onUpdateTransaction: updateTransaction,
    openModal,
    optimisticOperation,
    parentAccount,
    setSigned,
    signed,
    status,
    stepId,
    steps,
    t,
    title: t("cosmos.claimRewards.flow.title"),
    transaction,
    warning,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalClaimRewards" />
    </Stepper>
  );
};
const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
