import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { TFunction } from "i18next";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";

import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import StepClaimRewards, { StepClaimRewardsFooter } from "./steps/StepClaimRewards";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { AccountBridge, Operation, Account } from "@ledgerhq/types-live";
import { DelegationType } from "~/renderer/families/elrond/types";
import { StepProps, St, StepId } from "./types";
import {
  ElrondAccount,
  Transaction,
  ElrondProvider,
} from "@ledgerhq/live-common/families/elrond/types";
import { Device } from "@ledgerhq/types-devices";

export type Data = {
  account: ElrondAccount;
  delegations?: Array<DelegationType>;
  validators?: Array<ElrondProvider>;
  contract?: string;
};
interface OwnProps {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (step: StepId) => void;
  params: Data;
}
interface StateProps {
  t: TFunction;
  device: Device | undefined | null;
  accounts: Account[];
  openModal: OpenModal;
}
type Props = OwnProps & StateProps;
const steps: Array<St> = [
  {
    id: "claimRewards",
    label: <Trans i18nKey="elrond.claimRewards.flow.steps.claimRewards.title" />,
    component: StepClaimRewards,
    noScroll: true,
    footer: StepClaimRewardsFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="elrond.claimRewards.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("claimRewards"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="elrond.claimRewards.flow.steps.confirmation.title" />,
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
const Body = (props: Props) => {
  const { t, stepId, device, onClose, openModal, onChangeStepId, params } = props;
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const dispatch = useDispatch();
  const {
    account,
    transaction,
    bridgeError,
    setTransaction,
    updateTransaction,
    bridgePending,
    status,
    parentAccount,
  } = useBridgeTransaction(() => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(params.account, undefined);
    const transaction: Transaction = bridge.createTransaction(params.account);
    return {
      account: params.account,
      transaction: bridge.updateTransaction(transaction, {
        mode: "claimRewards",
      }),
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
  const error = transactionError || bridgeError || status.errors.amount;
  const warning = status.warnings ? Object.values(status.warnings)[0] : null;
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }
  const stepperProps = {
    title: t("elrond.claimRewards.flow.title"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: (!!error || !!warning) && ["claimRewards"].includes(stepId),
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose,
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
    delegations: params.delegations,
    validators: params.validators,
    contract: params.contract,
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
