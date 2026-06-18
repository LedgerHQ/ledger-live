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
import { Operation } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import StepWithdraw, { StepWithdrawFooter } from "./steps/StepWithdraw";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import type { StakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import { isStakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { BigNumber } from "bignumber.js";

export type Data = {
  account: StakingAccount;
  validatorAddress: string;
  amount: BigNumber;
  // Monad: validator id needed to finalize via `withdraw(validatorId, withdrawId)`.
  validatorId?: string;
  // Monad: slot id of the matured withdrawal request to finalize via `withdraw(withdrawId)`.
  withdrawId?: number;
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
    id: "withdraw",
    label: <Trans i18nKey="ethereum.evmStaking.withdraw.flow.steps.withdraw.title" />,
    component: StepWithdraw,
    noScroll: true,
    footer: StepWithdrawFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="ethereum.evmStaking.withdraw.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice as unknown as React.ComponentType<StepProps>,
    onBack: ({ transitionTo }: StepProps) => transitionTo("withdraw"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="ethereum.evmStaking.withdraw.flow.steps.confirmation.title" />,
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
  const {
    account,
    validatorAddress,
    validatorId,
    amount,
    withdrawId,
    source = "Account Page",
  } = params;
  const bridge = useAccountBridge<EvmTransaction>(account, undefined);

  const { transaction, parentAccount, status, bridgeError, bridgePending } = useBridgeTransaction(
    bridge,
    () => {
      invariant(isStakingAccount(account), "evm: account with staking resources required");
      // Monad: finalize the matured withdrawal slot via `withdraw(validatorId, withdrawId)`.
      const baseTransaction = bridge.createTransaction(account);
      const transaction = bridge.updateTransaction(baseTransaction, {
        mode: "withdraw",
        valAddress: validatorAddress,
        valId: validatorId,
        withdrawId: withdrawId?.toString(),
        recipient: account.freshAddress,
        amount,
        useAllAmount: false,
      } as unknown as Partial<EvmTransaction>);
      return {
        account,
        parentAccount: undefined,
        transaction,
      };
    },
  );

  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("withdraw");
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
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }

  const stepperProps = {
    title: t("ethereum.evmStaking.withdraw.flow.title"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && stepId === "withdraw",
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose,
    error,
    status,
    optimisticOperation,
    openModal,
    setSigned,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    t,
    bridgePending,
    source,
    validatorAddress,
    amount,
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalWithdraw" />
    </Stepper>
  );
};

const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);

export default C;
