import invariant from "invariant";
import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { useDispatch } from "LLD/hooks/redux";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { StepProps, St, StepId } from "./types";
import { Operation } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { closeModal, openModal } from "~/renderer/actions/modals";
import logger from "~/renderer/logger";
import Stepper from "~/renderer/components/Stepper";
import StepDRep, { StepDRepFooter } from "./steps/StepDRepSelection";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { CardanoAccount, Transaction as CardanoTransaction } from "@ledgerhq/live-common/families/cardano/types";
import { TFunction } from "i18next";
import { DRep } from "@ledgerhq/live-common/families/cardano/DRep";

type OwnProps = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: {
    account: CardanoAccount;
    option?: "dRep" | "noConfidence" | "abstain";
  };
  name: string;
};

type StateProps = {
  t: TFunction;
  accounts: CardanoAccount[];
  device: Device | undefined | null;
  closeModal: (a: string) => void;
  openModal: (a: string) => void;
};

type Props = OwnProps & StateProps;

const steps: Array<St> = [
  {
    id: "dRep",
    label: <Trans i18nKey="cardano.voteDelegation.flow.steps.dRep.title" />,
    component: StepDRep,
    noScroll: true,
    footer: StepDRepFooter,
  },
  {
    id: "summary",
    label: <Trans i18nKey="cardano.voteDelegation.flow.steps.summary.title" />,
    component: StepSummary,
    noScroll: true,
    footer: StepSummaryFooter,
    onBack: ({ transitionTo }: StepProps) => transitionTo("dRep"),
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="cardano.voteDelegation.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("summary"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="cardano.voteDelegation.flow.steps.confirmation.title" />,
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
const Body = ({
  t,
  stepId,
  device,
  closeModal,
  openModal,
  onChangeStepId,
  params,
  name,
}: Props) => {
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const [selectedDRep, setSelectedDRep] = useState<DRep | null>(null);
  const dispatch = useDispatch();
  const bridge = useAccountBridge<CardanoTransaction>(params.account, undefined);
  const {
    transaction,
    setTransaction,
    updateTransaction,
    account,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction(bridge, () => {
    const { account } = params;
    invariant(
      account && account.cardanoResources,
      "cardano: account and cardano resources required",
    );
    let transaction = bridge.createTransaction(account);

    transaction = bridge.updateTransaction(transaction, {
      mode: "voteDelegate",
      dRepAbstain: true,
    });

    const { option } = params;

    if (option === "abstain") {
      transaction = bridge.updateTransaction(transaction, {
        mode: "voteDelegate",
        dRepAbstain: true,
        dRepNoConfidence: undefined,
        dRepHex: undefined,
      });
    } else if (option === "noConfidence") {
      transaction = bridge.updateTransaction(transaction, {
        mode: "voteDelegate",
        dRepNoConfidence: true,
        dRepAbstain: undefined,
        dRepHex: undefined,
      });
    }

    return {
      account,
      transaction,
    };
  });

  const handleCloseModal = useCallback(() => {
    closeModal(name);
  }, [closeModal, name]);
  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("dRep");
  }, [onChangeStepId]);
  const handleTransactionError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);

  React.useEffect(() => {
    // If not a dRep selection flow, jump directly to summary step
    if (stepId === "dRep" && params.option && params.option !== "dRep") {
      onChangeStepId("summary");
    }
  }, [stepId, params.option, onChangeStepId]);
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
  const error = transactionError || bridgeError || status.errors.sender;
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }

  const activeSteps = React.useMemo(() => {
    if (params.option === "abstain" || params.option === "noConfidence") {
      return steps
        .filter(s => s.id !== "dRep")
        .map(s => {
          if (s.id === "summary") {
            return { ...s, onBack: undefined };
          }
          return s;
        });
    }
    return steps;
  }, [params.option]);

  const activeStepId = activeSteps.find(s => s.id === stepId) ? stepId : activeSteps[0].id;

  const stepperProps = {
    title: t("voteDelegation.header"),
    device,
    account,
    transaction,
    signed,
    stepId: activeStepId,
    steps: activeSteps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && ["dRep"].includes(stepId),
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose: handleCloseModal,
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
    selectedDRep,
    setSelectedDRep,
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalVoteDelegation" />
    </Stepper>
  );
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const C = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body) as React.ComponentType<OwnProps>;

export default C;
