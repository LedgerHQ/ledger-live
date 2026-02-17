import React, { useState, useCallback, useEffect, useMemo } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { TFunction } from "i18next";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { closeModal } from "~/renderer/actions/modals";
import Stepper, { Step } from "~/renderer/components/Stepper";
import StepAccount, { StepAccountFooter } from "./steps/StepAccount";
import StepConnectDevice, { StepConnectDeviceFooter } from "./steps/StepConnectDevice";
import StepWarning, { StepWarningFooter } from "./steps/StepWarning";
import StepReceiveFunds from "./steps/StepReceiveFunds";
import StepReceiveStakingFlow, { StepReceiveStakingFooter } from "./steps/StepReceiveStakingFlow";
import StepOptions from "./steps/StepOptions";
import { isAddressSanctioned } from "@ledgerhq/coin-framework/sanction/index";
import { AddressesSanctionedError } from "@ledgerhq/coin-framework/sanction/errors";
import { getReceiveFlowError } from "@ledgerhq/live-common/account/index";
import {
  onboardingReceiveFlowSelector,
  setIsOnboardingReceiveFlow,
} from "~/renderer/reducers/onboarding";

export type StepId =
  | "warning"
  | "account"
  | "device"
  | "receive"
  | "stakingFlow"
  | "receiveOptions";

export type Data = {
  account?: AccountLike | undefined | null;
  parentAccount?: Account | undefined | null;
  startWithWarning?: boolean;
  receiveTokenMode?: boolean;
  eventType?: string;
  isFromPostOnboardingEntryPoint?: boolean;
  shouldUseReceiveOptions?: boolean;
};

export type OwnProps = {
  stepId: StepId;
  onClose?: () => void | undefined;
  onChangeStepId: (a: StepId) => void;
  isAddressVerified: boolean | undefined | null;
  verifyAddressError: Error | undefined | null;
  onChangeAddressVerified: (isAddressVerified?: boolean | null, err?: Error | null) => void;
  params: Data;
  useLegacyReceiveOptions?: boolean;
};
export type StateProps = {
  t: TFunction;
  accounts: Account[];
  device: Device | undefined | null;
  closeModal: (a: string) => void;
};
export type Props = OwnProps & StateProps;
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
  isFromPostOnboardingEntryPoint?: boolean;
  accountError?: Error;
};
export type St = Step<StepId, StepProps>;
function createSteps(useLegacyReceiveOptions: boolean): Array<St> {
  const legacyOptionsStep: St = {
    id: "receiveOptions",
    excludeFromBreadcrumb: true,
    component: StepOptions,
  };
  const steps: Array<St> = [
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
  return useLegacyReceiveOptions ? [legacyOptionsStep, ...steps] : steps;
}
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
  useLegacyReceiveOptions = true,
}: Props) => {
  const steps = useMemo(() => createSteps(!!useLegacyReceiveOptions), [useLegacyReceiveOptions]);
  const [account, setAccount] = useState(() => (params && params.account) || accounts[0]);
  const [parentAccount, setParentAccount] = useState(() => params && params.parentAccount);
  const [disabledSteps, setDisabledSteps] = useState<number[]>([]);
  const [token, setToken] = useState(null);
  const [hideBreadcrumb, setHideBreadcrumb] = useState<boolean | undefined>(false);
  const [title, setTitle] = useState("");
  const [accountError, setAccountError] = useState<Error | undefined>(undefined);
  const dispatch = useDispatch();
  const isOnboardingReceiveFlow = useSelector(onboardingReceiveFlowSelector);
  const currency = getAccountCurrency(account);
  const currencyName = currency ? currency.name : undefined;
  const computeAccountError = useCallback(
    async (account: Account | TokenAccount, parentAccount?: Account | null) => {
      const mainAccount = getMainAccount(account, parentAccount);
      const addressSanctioned = await isAddressSanctioned(
        mainAccount.currency,
        mainAccount.freshAddress,
      );

      if (addressSanctioned) {
        setAccountError(
          new AddressesSanctionedError("AddressesSanctionedError", {
            addresses: [mainAccount.freshAddress],
          }),
        );
      } else {
        const error = account ? getReceiveFlowError(account, parentAccount) : undefined;
        setAccountError(error);
      }
    },
    [],
  );
  const handleChangeAccount = useCallback(
    async (account: Account | TokenAccount, parentAccount?: Account | null) => {
      setAccount(account);
      setParentAccount(parentAccount);
      computeAccountError(account, parentAccount);
    },
    [setParentAccount, setAccount, computeAccountError],
  );
  const handleCloseModal = useCallback(() => {
    if (isOnboardingReceiveFlow) {
      dispatch(
        setIsOnboardingReceiveFlow({
          isFlow: false,
          isSuccess: !!isAddressVerified,
        }),
      );
    }
    closeModal("MODAL_RECEIVE");
  }, [closeModal, dispatch, isOnboardingReceiveFlow, isAddressVerified]);

  const handleStepChange = useCallback(
    (e: Step<StepId, StepProps>) => onChangeStepId(e.id),
    [onChangeStepId],
  );
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
      if (params && params.account) {
        handleChangeAccount(params.account, params?.parentAccount);
      } else {
        handleChangeAccount(accounts[0]);
      }
    }
  }, [accounts, account, params, handleChangeAccount]);
  useEffect(() => {
    const currentStep = steps.find(step => step.id === stepId);
    setHideBreadcrumb(currentStep?.excludeFromBreadcrumb);
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
  useEffect(() => {
    if (account) {
      computeAccountError(account, parentAccount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    isFromPostOnboardingEntryPoint: !!params.isFromPostOnboardingEntryPoint,
    accountError: accountError,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalReceive" />
    </Stepper>
  );
};
const C = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body) as React.ComponentType<OwnProps>;
export default C;
