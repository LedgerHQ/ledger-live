import React, { useState, useCallback, useEffect } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { TFunction, Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { closeModal } from "~/renderer/actions/modals";
import Stepper, { Step } from "~/renderer/components/Stepper";
import StepAccount, { StepAccountFooter } from "./steps/StepAccount";
import StepConnectDevice, { StepConnectDeviceFooter } from "./steps/StepConnectDevice";
import StepWarning, { StepWarningFooter } from "./steps/StepWarning";
import StepReceiveFunds from "./steps/StepReceiveFunds";
import StepReceiveStakingFlow, { StepReceiveStakingFooter } from "./steps/StepReceiveStakingFlow";
export type StepId = "warning" | "account" | "device" | "receive";
type OwnProps = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  isAddressVerified: boolean | undefined | null;
  verifyAddressError: Error | undefined | null;
  onChangeAddressVerified: (isAddressVerified?: boolean | null, err?: Error | null) => void;
  params: {
    account: AccountLike | undefined | null;
    parentAccount: Account | undefined | null;
    startWithWarning?: boolean;
    receiveTokenMode?: boolean;
    eventType?: string;
  };
};
type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  accounts: Account[];
  device: Device | undefined | null;
  closeModal: (a: string) => void;
};
type Props = {} & OwnProps & StateProps;
export type StepProps = {
  t: TFunction;
  transitionTo: (id: string) => void;
  device: Device | undefined | null;
  account: AccountLike | undefined | null;
  eventType?: string;
  parentAccount: Account | undefined | null;
  token: TokenCurrency | undefined | null;
  receiveTokenMode: boolean;
  closeModal: () => void;
  isAddressVerified: boolean | undefined | null;
  verifyAddressError: Error | undefined | null;
  onRetry: () => void;
  onSkipConfirm: () => void;
  onResetSkip: () => void;
  onChangeToken: (token?: TokenCurrency | null) => void;
  onChangeAccount: (account?: AccountLike | null, tokenAccount?: Account | null) => void;
  onChangeAddressVerified: (b?: boolean | null, a?: Error | null) => void;
  onClose: () => void;
  currencyName: string | undefined | null;
};
export type St = Step<StepId, StepProps>;
const createSteps = (): Array<St> => [
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
    component: StepConnectDevice,
    footer: StepConnectDeviceFooter,
    onBack: ({ transitionTo }: StepProps) => transitionTo("account"),
  },
  {
    id: "receive",
    label: <Trans i18nKey="receive.steps.receiveFunds.title" />,
    component: StepReceiveFunds,
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
  const [steps] = useState(createSteps);
  const [account, setAccount] = useState(() => (params && params.account) || accounts[0]);
  const [parentAccount, setParentAccount] = useState(() => params && params.parentAccount);
  const [disabledSteps, setDisabledSteps] = useState([]);
  const [token, setToken] = useState(null);
  const [hideBreadcrumb, setHideBreadcrumb] = useState(false);
  const [title, setTitle] = useState("");
  const currency = getAccountCurrency(account);
  const currencyName = currency ? currency.name : undefined;
  const handleChangeAccount = useCallback(
    (account, parentAccount) => {
      setAccount(account);
      setParentAccount(parentAccount);
    },
    [setParentAccount, setAccount],
  );
  const handleCloseModal = useCallback(() => {
    closeModal("MODAL_RECEIVE");
  }, [closeModal]);
  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);
  const handleResetSkip = useCallback(() => {
    setDisabledSteps([]);
  }, [setDisabledSteps]);
  const handleRetry = useCallback(() => {
    onChangeAddressVerified(null, null);
  }, [onChangeAddressVerified]);
  const handleSkipConfirm = useCallback(() => {
    const connectStepIndex = steps.findIndex(step => step.id === "device");
    if (connectStepIndex > -1) {
      onChangeAddressVerified(false, null);
      setDisabledSteps([connectStepIndex]);
    }
    onChangeStepId("receive");
  }, [onChangeAddressVerified, setDisabledSteps, steps, onChangeStepId]);
  useEffect(() => {
    const stepId =
      params && params.startWithWarning ? "warning" : params.receiveTokenMode ? "account" : null;
    if (stepId) onChangeStepId(stepId);
  }, [onChangeStepId, params]);
  useEffect(() => {
    if (!account) {
      if (!params && params.account) {
        handleChangeAccount(params.account, params.parentAccount);
      } else {
        handleChangeAccount(accounts[0], null);
      }
    }
  }, [accounts, account, params, handleChangeAccount]);
  useEffect(() => {
    const currentStep = steps.find(step => step.id === stepId);
    setHideBreadcrumb(currentStep.excludeFromBreadcrumb);
    switch (stepId) {
      case "warning":
        setTitle(t("common.information"));
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
  const errorSteps = verifyAddressError ? [2] : [];
  const stepperProps = {
    title,
    device,
    account,
    parentAccount,
    eventType: params.eventType,
    stepId,
    steps,
    errorSteps,
    disabledSteps,
    receiveTokenMode: !!params.receiveTokenMode,
    hideBreadcrumb,
    token,
    isAddressVerified,
    verifyAddressError,
    closeModal: handleCloseModal,
    onRetry: handleRetry,
    onSkipConfirm: handleSkipConfirm,
    onResetSkip: handleResetSkip,
    onChangeAccount: handleChangeAccount,
    onChangeToken: setToken,
    onChangeAddressVerified,
    onStepChange: handleStepChange,
    onClose: handleCloseModal,
    currencyName,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalReceive" />
    </Stepper>
  );
};
const C: React$ComponentType<OwnProps> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
