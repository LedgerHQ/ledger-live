import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { TFunction } from "i18next";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";

import Stepper from "~/renderer/components/Stepper";
import StepDelegation, { StepDelegationFooter } from "./steps/StepDelegation";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import Track from "~/renderer/analytics/Track";
import logger from "~/renderer/logger";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/elrond/constants";
import { Account, AccountBridge, Operation } from "@ledgerhq/types-live";
import { DelegationType } from "~/renderer/families/elrond/types";
import { StepProps, St, StepId } from "./types";
import {
  ElrondAccount,
  ElrondProvider,
  Transaction,
} from "@ledgerhq/live-common/families/elrond/types";
import { Device } from "@ledgerhq/types-devices";

export type Data = {
  account: ElrondAccount;
  validators?: Array<ElrondProvider>;
  delegations?: Array<DelegationType>;
  source?: string;
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
    id: "validator",
    label: <Trans i18nKey="elrond.delegation.flow.steps.validator.title" />,
    component: StepDelegation,
    noScroll: true,
    footer: StepDelegationFooter,
  },
  {
    id: "amount",
    label: <Trans i18nKey="elrond.delegation.flow.steps.amount.title" />,
    component: StepAmount,
    onBack: ({ transitionTo }: StepProps) => transitionTo("validator"),
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="elrond.delegation.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="elrond.delegation.flow.steps.confirmation.title" />,
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
  const defaultValidator: ElrondProvider | undefined = params.validators?.find(
    validator => validator.contract === ELROND_LEDGER_VALIDATOR_ADDRESS,
  );
  const { account, source = "Account Page" } = params;
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
    const transaction: Transaction = bridge.createTransaction(account);
    return {
      account,
      parentAccount: undefined,
      transaction: bridge.updateTransaction(transaction, {
        recipient: defaultValidator ? defaultValidator.contract : "",
      }),
    };
  });

  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("validator");
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
    title: t("elrond.delegation.flow.title"),
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
    validators: params.validators,
    delegations: params.delegations,
    source,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount={true} event="CloseModalDelegation" />
    </Stepper>
  );
};
const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
