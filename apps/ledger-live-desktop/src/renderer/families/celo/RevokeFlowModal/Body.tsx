import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { connect, useDispatch } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import logger from "~/renderer/logger";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { OpenModal, openModal } from "~/renderer/actions/modals";

import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import StepVote, { StepVoteFooter } from "./steps/StepVote";
import { CeloAccount, CeloVote, Transaction } from "@ledgerhq/live-common/families/celo/types";
import { AccountBridge, Operation, Account, SubAccount } from "@ledgerhq/types-live";
import { St, StepProps, StepId } from "./types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

export type Data = {
  account: CeloAccount | SubAccount;
  parentAccount: CeloAccount | undefined | null;
  vote: CeloVote;
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
    id: "vote",
    label: <Trans i18nKey="celo.revoke.steps.vote.title" />,
    component: StepVote,
    noScroll: true,
    footer: StepVoteFooter,
  },
  {
    id: "amount",
    label: <Trans i18nKey="celo.revoke.steps.amount.title" />,
    component: StepAmount,
    onBack: ({ transitionTo }: StepProps) => transitionTo("vote"),
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="celo.revoke.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="celo.revoke.steps.confirmation.title" />,
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
const Body = ({ t, stepId, device, onClose, openModal, onChangeStepId, params }: Props) => {
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
    const { account, vote } = params;
    invariant(
      account?.type === "Account" && account.celoResources,
      "celo: account and celo resources required",
    );
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, undefined);
    const transaction = bridge.updateTransaction(bridge.createTransaction(account), {
      mode: "revoke",
      recipient: vote?.validatorGroup,
      index: vote?.index,
    });
    return {
      account,
      parentAccount: undefined,
      transaction,
    };
  });

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
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }
  const stepperProps = {
    title: t("celo.revoke.title"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && ["vote"].includes(stepId),
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
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalRevoke" />
    </Stepper>
  );
};
const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
