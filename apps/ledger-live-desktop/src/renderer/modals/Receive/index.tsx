import React, { useState, useCallback, useEffect } from "react";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import logger from "~/renderer/logger";
import Modal from "~/renderer/components/Modal";
import Body, { StepId } from "./Body";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useTrackReceiveFlow } from "~/renderer/analytics/hooks/useTrackReceiveFlow";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { closeModal } from "~/renderer/actions/modals";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ReceiveOptionsDialog } from "LLD/features/Receive";
import { GlobalModalData } from "../types";
import {
  onboardingReceiveFlowSelector,
  setIsOnboardingReceiveFlow,
} from "~/renderer/reducers/onboarding";

type State = {
  stepId: StepId;
  isAddressVerified: boolean | undefined | null;
  verifyAddressError: Error | undefined | null;
};

function getInitialState(
  isNoahActive: boolean,
  account: AccountLike | null | undefined,
  isOnboardingFlow?: boolean,
  activeCurrencyIds?: string[],
): State {
  const accountCurrency = account ? getAccountCurrency(account) : null;
  const isValidAccount =
    activeCurrencyIds && accountCurrency?.id
      ? activeCurrencyIds.includes(accountCurrency.id)
      : false;
  const shouldUseReceiveOptions = isNoahActive && (!account || isValidAccount);
  return {
    stepId: !isOnboardingFlow && shouldUseReceiveOptions ? "receiveOptions" : "account",
    isAddressVerified: null,
    verifyAddressError: null,
  };
}

const ReceiveModal = (props: GlobalModalData["MODAL_RECEIVE"]) => {
  const noahFeature = useFeature("noah");
  const { shouldDisplayNewReceiveDialog } = useWalletFeaturesConfig("desktop");
  const isOnboardingReceiveFlow = useSelector(onboardingReceiveFlowSelector);
  const isNoahActive = noahFeature?.enabled === true && props?.shouldUseReceiveOptions !== false;
  const initialState = getInitialState(
    isNoahActive,
    props?.account,
    isOnboardingReceiveFlow,
    noahFeature?.params?.activeCurrencyIds,
  );
  const [state, setState] = useState<State>(() => initialState);

  const { stepId, isAddressVerified, verifyAddressError } = state;

  const device = useSelector(getCurrentDevice);

  useTrackReceiveFlow({
    location: HOOKS_TRACKING_LOCATIONS.receiveModal,
    device,
    verifyAddressError,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
  });

  const setStepId = useCallback((newStepId: State["stepId"]) => {
    setState(prevState => ({ ...prevState, stepId: newStepId }));
  }, []);

  const setIsAddressVerified = (newIsAddressVerified: State["isAddressVerified"]) => {
    setState(prevState => ({ ...prevState, isAddressVerified: newIsAddressVerified }));
  };

  const setVerifyAddressError = (newVerifyAddressError: State["verifyAddressError"]) => {
    setState(prevState => ({ ...prevState, verifyAddressError: newVerifyAddressError }));
  };

  const handleReset = () => {
    setStepId(initialState.stepId);
    setIsAddressVerified(initialState.isAddressVerified);
    setVerifyAddressError(initialState.verifyAddressError);
  };

  const handleChangeAddressVerified = (isAddressVerified?: boolean | null, err?: Error | null) => {
    if (err && err.name !== "UserRefusedAddress") {
      logger.critical(err);
    }
    setIsAddressVerified(isAddressVerified);
    setVerifyAddressError(err);
  };

  // Making sure at least one account exists, if not, redirecting to the add account modal
  const accounts = useSelector(accountsSelector);

  const hasAccounts = !!accounts.length;

  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "receive",
    "MODAL_RECEIVE",
  );

  const dispatch = useDispatch();

  const openAddAccounts = useCallback(() => {
    openAssetFlow();
    dispatch(closeModal("MODAL_RECEIVE"));
  }, [dispatch, openAssetFlow]);

  const handleClose = useCallback(
    (success = false) => {
      if (isOnboardingReceiveFlow) {
        dispatch(setIsOnboardingReceiveFlow({ isFlow: false, isSuccess: success }));
      }
      dispatch(closeModal("MODAL_RECEIVE"));
    },
    [dispatch, isOnboardingReceiveFlow],
  );

  useEffect(() => {
    if (!hasAccounts) {
      openAddAccounts();
    }
  }, [dispatch, hasAccounts, openAddAccounts, setStepId]);

  if (!hasAccounts) return null;

  // TODO: Remove this once the new receive dialog is fully implemented
  if (shouldDisplayNewReceiveDialog && stepId === "receiveOptions") {
    return (
      <ReceiveOptionsDialog
        onClose={() => handleClose(false)}
        onGoToAccount={() => setStepId("account")}
      />
    );
  }

  const isModalLocked = stepId === "receive" && isAddressVerified === null;

  return (
    <Modal
      name="MODAL_RECEIVE"
      centered
      onHide={handleReset}
      preventBackdropClick={isModalLocked}
      render={({ data, onClose }) => (
        <Body
          onClose={onClose}
          stepId={stepId}
          isAddressVerified={isAddressVerified}
          verifyAddressError={verifyAddressError}
          onChangeAddressVerified={handleChangeAddressVerified}
          onChangeStepId={setStepId}
          params={data || {}}
          useLegacyReceiveOptions={!shouldDisplayNewReceiveDialog}
        />
      )}
    />
  );
};

export default ReceiveModal;
