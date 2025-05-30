import React, { useState, useCallback, useMemo } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import Track from "~/renderer/analytics/Track";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";

import Stepper from "~/renderer/components/Stepper";
import StepVote, { StepVoteFooter } from "./steps/StepVote";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { CeloAccount, CeloVote } from "@ledgerhq/live-common/families/celo/types";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { StepId, StepProps, St } from "./types";

export type Data = {
  account: CeloAccount | TokenAccount;
  parentAccount: CeloAccount | undefined | null;
  vote?: CeloVote;
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
    id: "vote",
    label: <Trans i18nKey="celo.activate.steps.vote.title" />,
    component: StepVote,
    noScroll: true,
    footer: StepVoteFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="celo.activate.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("vote"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="celo.activate.steps.confirmation.title" />,
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
  const { account, parentAccount, vote, source } = params;
  const { transaction, setTransaction, status, bridgeError, bridgePending } = useBridgeTransaction(
    () => {
      const bridge = getAccountBridge(account, parentAccount);
      const t = bridge.createTransaction(account);
      const transaction = bridge.updateTransaction(t, {
        mode: "activate",
        recipient: vote?.validatorGroup,
      });
      return {
        account,
        parentAccount,
        transaction,
      };
    },
  );

  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    onChangeStepId("vote");
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
  const statusError = useMemo(
    () => status.errors && Object.values(status.errors)[0],
    [status.errors],
  );
  const error =
    transactionError || bridgeError || (statusError instanceof Error ? statusError : null);
  const stepperProps = {
    title: t("celo.activate.title"),
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
    error,
    status,
    optimisticOperation,
    openModal,
    setSigned,
    onChangeTransaction: setTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    t,
    bridgePending,
    source,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalActivate" />
    </Stepper>
  );
};
const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
