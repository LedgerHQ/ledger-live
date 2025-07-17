import React, { useState, useCallback, useEffect } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import invariant from "invariant";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/hedera/types";
import { isTokenAssociationRequired } from "@ledgerhq/live-common/families/hedera/logic";
import { HEDERA_TRANSACTION_KINDS } from "@ledgerhq/live-common/families/hedera/constants";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import Track from "~/renderer/analytics/Track";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { closeModal } from "~/renderer/actions/modals";
import Stepper, { Step } from "~/renderer/components/Stepper";
import StepConnectDevice, {
  StepConnectDeviceFooter,
} from "~/renderer/modals/Receive/steps/StepConnectDevice";
import StepWarning, { StepWarningFooter } from "~/renderer/modals/Receive/steps/StepWarning";
import StepReceiveFunds from "~/renderer/modals/Receive/steps/StepReceiveFunds";
import type { StepId as DefaultStepId } from "~/renderer/modals/Receive/Body";
import StepReceiveStakingFlow, {
  StepReceiveStakingFooter,
} from "~/renderer/modals/Receive/steps/StepReceiveStakingFlow";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { addPendingOperation } from "@ledgerhq/coin-framework/account/pending";
import logger from "~/renderer/logger";
import StepAccount from "~/renderer/modals/Receive/steps/StepAccount";
import type {
  Data as DefaultData,
  StepProps as DefaultStepProps,
  OwnProps as DefaultOwnProps,
  StateProps as DefaultStateProps,
} from "~/renderer/modals/Receive/Body";
import StepAssociationConfirmation, {
  StepAssociationConfirmationFooter,
} from "./steps/StepAssociationConfirmation";
import { StepAccountFooter } from "./steps/StepAccountFooter";
import StepAssociationDevice from "./steps/StepAssociationDevice";

type CustomStepId = "associationDevice" | "associationConfirmation";

export type StepId = DefaultStepId | CustomStepId;

export type Data = DefaultData;

type OwnProps = Omit<DefaultOwnProps, "stepId" | "onChangeStepId"> & {
  stepId: StepId;
  onChangeStepId: (a: StepId) => void;
};

type StateProps = DefaultStateProps;

type Props = OwnProps & StateProps;

export type StepProps = DefaultStepProps & {
  isAssociationFlow: boolean;
  transaction: Transaction | undefined | null;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  status: TransactionStatus;
  signed: boolean;
  bridgePending: boolean;
  setSigned: (a: boolean) => void;
  onChangeTransaction: (a: Transaction) => void;
  onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
};

type St = Step<StepId, StepProps>;

const createSteps = (isAssociationFlow: boolean): Array<St> => [
  {
    id: "warning",
    excludeFromBreadcrumb: true,
    component: StepWarning,
    footer: StepWarningFooter,
  },
  {
    id: "account",
    label: <Trans i18nKey="receive.steps.chooseAccount.title" />,
    component: StepAccount,
    noScroll: true,
    footer: StepAccountFooter,
  },
  {
    id: "device",
    label: <Trans i18nKey="receive.steps.connectDevice.title" />,
    excludeFromBreadcrumb: isAssociationFlow,
    component: StepConnectDevice,
    footer: StepConnectDeviceFooter,
    onBack: ({ transitionTo }: StepProps) => transitionTo("account"),
  },
  {
    id: "receive",
    label: <Trans i18nKey="receive.steps.receiveFunds.title" />,
    excludeFromBreadcrumb: isAssociationFlow,
    component: StepReceiveFunds,
  },
  {
    id: "associationDevice",
    label: <Trans i18nKey="receive.steps.connectDevice.title" />,
    excludeFromBreadcrumb: !isAssociationFlow,
    component: StepAssociationDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("account"),
  },
  {
    id: "associationConfirmation",
    label: (
      <Trans i18nKey="hedera.receiveWithAssociation.steps.associationConfirmation.breadcrumbTitle" />
    ),
    excludeFromBreadcrumb: !isAssociationFlow,
    component: StepAssociationConfirmation,
    footer: StepAssociationConfirmationFooter,
  },
  {
    id: "stakingFlow",
    excludeFromBreadcrumb: true,
    component: StepReceiveStakingFlow,
    footer: StepReceiveStakingFooter,
  },
];

const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
  accounts: accountsSelector,
});

const mapDispatchToProps = {
  closeModal,
};

const Body = ({
  t,
  stepId,
  device,
  accounts,
  closeModal,
  onChangeStepId,
  isAddressVerified,
  verifyAddressError,
  onChangeAddressVerified,
  params,
}: Props) => {
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const [account, setAccount] = useState(() => (params && params.account) || accounts[0]);
  const [parentAccount, setParentAccount] = useState(() => params && params.parentAccount);
  const [disabledSteps, setDisabledSteps] = useState<number[]>([]);
  const [token, setToken] = useState<TokenCurrency | null>(null);
  const [hideBreadcrumb, setHideBreadcrumb] = useState<boolean | undefined>(false);
  const [title, setTitle] = useState("");
  const dispatch = useDispatch();

  const receiveTokenMode = !!params.receiveTokenMode;
  const isAssociationFlow = receiveTokenMode ? isTokenAssociationRequired(account, token) : false;
  const [steps, setSteps] = useState(() => createSteps(isAssociationFlow));

  const currency = getAccountCurrency(account);
  const currencyName = currency ? currency.name : undefined;

  const {
    transaction,
    status,
    bridgeError,
    bridgePending,
    updateTransaction,
    setAccount: updateTransactionAccount,
  } = useBridgeTransaction(() => {
    invariant(account, "hedera: account is required");

    const bridge = getAccountBridge(account, parentAccount);
    const transaction = bridge.createTransaction(account);

    return {
      account,
      parentAccount,
      transaction,
    };
  });

  const getTransactionProperties = useCallback(
    (token: TokenCurrency | undefined | null): Transaction["properties"] | null => {
      if (!token) {
        return null;
      }

      return {
        name: HEDERA_TRANSACTION_KINDS.TokenAssociate.name,
        token,
      };
    },
    [],
  );

  const handleChangeAccount = useCallback(
    (account: Account | TokenAccount, parentAccount?: Account | null) => {
      setAccount(account);
      setParentAccount(parentAccount);

      const transactionProperties = getTransactionProperties(token);
      updateTransactionAccount(account, parentAccount);
      updateTransaction(prev => ({ ...prev, properties: transactionProperties }));
    },
    [
      token,
      updateTransaction,
      updateTransactionAccount,
      getTransactionProperties,
      setParentAccount,
      setAccount,
    ],
  );

  const handleChangeToken = useCallback(
    (token?: TokenCurrency | null) => {
      setToken(token ?? null);

      const transactionProperties = getTransactionProperties(token);
      updateTransaction(prev => ({ ...prev, properties: transactionProperties }));
    },
    [getTransactionProperties, updateTransaction],
  );

  const handleCloseModal = useCallback(() => {
    closeModal("MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION");
  }, [closeModal]);

  const handleStepChange = useCallback(
    (e: Step<StepId, StepProps>) => onChangeStepId(e.id),
    [onChangeStepId],
  );

  const handleResetSkip = useCallback(() => {
    setDisabledSteps([]);
  }, [setDisabledSteps]);

  const handleRetry = useCallback(() => {
    onChangeAddressVerified(null, null);
    setTransactionError(null);
    onChangeStepId("account");
  }, [onChangeStepId, onChangeAddressVerified]);

  const handleSkipConfirm = useCallback(() => {
    const connectStepIndex = steps.findIndex(
      step => step.id === "device" || step.id === "associationDevice",
    );
    if (connectStepIndex > -1) {
      onChangeAddressVerified(false, null);
      setDisabledSteps([connectStepIndex]);
    }
    onChangeStepId("receive");
  }, [onChangeAddressVerified, setDisabledSteps, steps, onChangeStepId]);

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

  useEffect(() => {
    const stepId =
      params && params.startWithWarning ? "warning" : params.receiveTokenMode ? "account" : null;
    if (stepId) onChangeStepId(stepId);
  }, [onChangeStepId, params]);

  useEffect(() => {
    if (!account) {
      if (params && params.account) {
        handleChangeAccount(params.account, params?.parentAccount);
      } else {
        handleChangeAccount(accounts[0]);
      }
    }
  }, [accounts, account, params, handleChangeAccount]);

  useEffect(() => {
    const currentStep = steps.find(step => step.id === stepId);

    if (stepId !== "associationDevice") {
      setHideBreadcrumb(currentStep?.excludeFromBreadcrumb);
    }

    switch (stepId) {
      case "warning":
        setTitle(t("common.information"));
        break;
      case "associationDevice":
        setTitle(t("hedera.receiveWithAssociation.steps.associationConfirmation.title"));
        break;
      case "stakingFlow":
        setTitle(
          t("receive.steps.staking.title", {
            currencyName: currency.name,
          }),
        );
        break;
      default:
        setTitle(t("receive.title"));
    }
  }, [steps, stepId, t, currency.name]);

  useEffect(() => {
    const updatedSteps = createSteps(isAssociationFlow);
    setSteps(updatedSteps);
  }, [isAssociationFlow]);

  const error = transactionError || bridgeError;
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }

  const stepperProps = {
    title,
    device,
    account,
    parentAccount,
    eventType: params.eventType,
    stepId,
    steps,
    error,
    errorSteps,
    disabledSteps,
    receiveTokenMode,
    receiveNFTMode: !!params.receiveNFTMode,
    receiveOrdinalMode: !!params.receiveOrdinalMode,
    hideBreadcrumb,
    token,
    isAddressVerified,
    verifyAddressError,
    isAssociationFlow,
    optimisticOperation,
    transaction,
    status,
    bridgePending,
    signed,
    setSigned,
    onOperationBroadcasted: handleOperationBroadcasted,
    onUpdateTransaction: updateTransaction,
    onTransactionError: handleTransactionError,
    closeModal: handleCloseModal,
    onRetry: handleRetry,
    onSkipConfirm: handleSkipConfirm,
    onResetSkip: handleResetSkip,
    onChangeAccount: handleChangeAccount,
    onChangeToken: handleChangeToken,
    onChangeAddressVerified,
    onStepChange: handleStepChange,
    onClose: handleCloseModal,
    currencyName,
    isFromPostOnboardingEntryPoint: !!params.isFromPostOnboardingEntryPoint,
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalReceiveWithAssociation" />
    </Stepper>
  );
};
const C = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body) as React.ComponentType<OwnProps>;
export default C;
