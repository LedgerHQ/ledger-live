import type { TFunction } from "i18next";
import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { useDispatch } from "LLD/hooks/redux";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Account, Operation } from "@ledgerhq/types-live";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import type { Device } from "@ledgerhq/types-devices";
import Track from "~/renderer/analytics/Track";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, closeModal, openModal } from "~/renderer/reducers/modals";
import logger from "~/renderer/logger";
import Stepper from "~/renderer/components/Stepper";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepRewards, { StepRewardsFooter } from "./steps/StepRewards";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import type { StepProps, St, StepId } from "./types";

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
  closeModal: () => void;
  openModal: OpenModal;
};

type Props = OwnProps & StateProps;

const steps: Array<St> = [
  {
    id: "rewards",
    label: <Trans i18nKey="hedera.claimRewards.flow.steps.rewards.title" />,
    component: StepRewards,
    noScroll: true,
    footer: StepRewardsFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="hedera.claimRewards.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("rewards"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="hedera.claimRewards.flow.steps.confirmation.title" />,
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
      const bridge = getAccountBridge(account);
      const t = bridge.createTransaction(account);

      const transaction = bridge.updateTransaction(t, {
        mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
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
    onChangeStepId("rewards");
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
    title: t("hedera.claimRewards.flow.title"),
    device,
    account,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && ["rewards"].includes(stepId),
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
      <Track onUnmount event="CloseModalClaimRewards" />
    </Stepper>
  );
};

const C = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body) as React.ComponentType<OwnProps>;

export default C;
