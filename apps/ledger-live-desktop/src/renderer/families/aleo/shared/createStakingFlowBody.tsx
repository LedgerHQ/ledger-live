import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { useDispatch } from "LLD/hooks/redux";
import { withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import Stepper, { Step } from "~/renderer/components/Stepper";
import logger from "~/renderer/logger";
import {
  AleoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/aleo/types";
import { Account, Operation } from "@ledgerhq/types-live";

// Shared between BondPublicFlowModal / UnbondFlowModal / ClaimUnbondFlowModal:
// the three Body.tsx files were ~90% byte-identical, differing only by the
// steps array, the initial transaction patch, the initial step id, the title
// key and the close-tracking event. This factory captures the shared shell,
// matching the createStakingFlowModal / createStepConfirmation factories.

export type StakingFlowData = {
  account: AleoAccount;
  parentAccount?: Account;
  source?: string;
};

// Structurally identical to each flow's StepProps in its types.ts.
export type StakingStepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: Account | undefined | null;
  parentAccount: Account | undefined | null;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  signed: boolean;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
  source?: string;
};

export type StakingFlowBodyOwnProps<StepId extends string> = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: StakingFlowData;
};

type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  openModal: OpenModal;
};

type StakingFlowBodyConfig<StepId extends string> = {
  steps: Array<Step<StepId, StakingStepProps>>;
  initialStepId: StepId;
  title: string;
  trackCloseEvent: string;
  mode: Transaction["mode"];
  recipientFromFresh?: boolean;
  withdrawalFromFresh?: boolean;
};

export function createStakingFlowBody<StepId extends string>({
  steps,
  initialStepId,
  title,
  trackCloseEvent,
  mode,
  recipientFromFresh,
  withdrawalFromFresh,
}: StakingFlowBodyConfig<StepId>) {
  type Props = StakingFlowBodyOwnProps<StepId> & StateProps;

  const confirmationIndex = steps.length - 1;
  const connectDeviceIndex = steps.length - 2;

  const mapStateToProps = createStructuredSelector({ device: getCurrentDevice });
  const mapDispatchToProps = { openModal };

  const Body = ({ t, stepId, device, onClose, openModal, onChangeStepId, params }: Props) => {
    const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
    const [transactionError, setTransactionError] = useState<Error | null>(null);
    const [signed, setSigned] = useState(false);
    const dispatch = useDispatch();
    const { account, parentAccount, source = "Account Page" } = params;
    const bridge = useAccountBridge<Transaction>(account, parentAccount);

    const { transaction, setTransaction, updateTransaction, status, bridgeError, bridgePending } =
      useBridgeTransaction<Transaction>(bridge, () => {
        const mainAccount = getMainAccount(account, parentAccount);
        const t0 = bridge.createTransaction(account);
        const patch: Partial<Transaction> & { withdrawal?: string } = {
          mode,
          recipient: recipientFromFresh ? mainAccount.freshAddress : "",
        };
        if (withdrawalFromFresh) patch.withdrawal = mainAccount.freshAddress;
        const transaction = bridge.updateTransaction(t0, patch);
        return { account, parentAccount, transaction };
      });

    const handleStepChange = useCallback(
      (e: Step<StepId, StakingStepProps>) => onChangeStepId(e.id),
      [onChangeStepId],
    );
    const handleRetry = useCallback(() => {
      setTransactionError(null);
      onChangeStepId(initialStepId);
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
    const errorSteps: number[] = [];
    if (transactionError) {
      errorSteps.push(
        stepId === steps[confirmationIndex].id ? confirmationIndex : connectDeviceIndex,
      );
    } else if (bridgeError) {
      errorSteps.push(0);
    }

    const stepperProps = {
      title: t(title),
      device,
      account,
      parentAccount,
      transaction,
      signed,
      stepId,
      steps,
      errorSteps,
      disabledSteps: [],
      hideBreadcrumb: !!error && stepId === initialStepId,
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
    };

    return (
      <Stepper {...stepperProps}>
        <SyncSkipUnderPriority priority={100} />
        <Track onUnmount event={trackCloseEvent} />
      </Stepper>
    );
  };

  return compose<React.ComponentType<StakingFlowBodyOwnProps<StepId>>>(
    connect(mapStateToProps, mapDispatchToProps),
    withTranslation(),
  )(Body);
}
