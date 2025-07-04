import invariant from "invariant";
import type { TFunction } from "i18next";
import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Account, AccountBridge, Operation } from "@ledgerhq/types-live";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import { getValidatorFromAccount } from "@ledgerhq/live-common/families/hedera/logic";
import type { Device } from "@ledgerhq/types-devices";
import Track from "~/renderer/analytics/Track";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { closeModal, openModal } from "~/renderer/actions/modals";
import logger from "~/renderer/logger";
import Stepper from "~/renderer/components/Stepper";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { StepProps, St, StepId } from "./types";

export type Data = {
  account: HederaAccount;
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
  closeModal: (a: string) => void;
  openModal: (a: string) => void;
};

type Props = OwnProps & StateProps;

const steps: Array<St> = [
  {
    id: "summary",
    label: <Trans i18nKey="hedera.undelegate.flow.steps.summary.title" />,
    component: StepSummary,
    noScroll: true,
    footer: StepSummaryFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="hedera.undelegate.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("summary"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="hedera.undelegate.flow.steps.confirmation.title" />,
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
  const { account, source = "Account Page" } = params;
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const dispatch = useDispatch();
  const { transaction, setTransaction, updateTransaction, status, bridgeError, bridgePending } =
    useBridgeTransaction(() => {
      const bridge: AccountBridge<Transaction> = getAccountBridge(account);
      const t = bridge.createTransaction(account);

      const validator = getValidatorFromAccount(account);
      invariant(validator, "hedera: validator not found in undelegate flow");

      const transaction = bridge.updateTransaction(t, {
        recipient: validator.address,
        memo: "Unstake",
        properties: {
          name: "staking",
          mode: "undelegate",
          stakedNodeId: null,
        },
      });

      return {
        account,
        parentAccount: undefined,
        transaction,
      };
    });

  const handleStepChange = useCallback(
    (e: St) => {
      onChangeStepId(e.id);
    },
    [onChangeStepId],
  );

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("summary");
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
    title: t("hedera.undelegate.flow.title"),
    device,
    account,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && ["summary"].includes(stepId),
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
      <Track onUnmount event="CloseModalUndelegation" />
    </Stepper>
  );
};

const C = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body) as React.ComponentType<OwnProps>;

export default C;
