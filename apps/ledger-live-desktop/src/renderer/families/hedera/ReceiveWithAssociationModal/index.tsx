import React, { useState, useCallback, useEffect } from "react";
import logger from "~/renderer/logger";
import Modal from "~/renderer/components/Modal";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal, closeModal } from "~/renderer/actions/modals";
import { useTrackReceiveFlow } from "~/renderer/analytics/hooks/useTrackReceiveFlow";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import Body from "./Body";
import type { StepId } from "./types";

type State = {
  stepId: StepId;
  isAddressVerified: boolean | undefined | null;
  verifyAddressError: Error | undefined | null;
};

const INITIAL_STATE = {
  stepId: "account" as const satisfies StepId,
  isAddressVerified: null,
  verifyAddressError: null,
};

const ReceiveWithAssociationModal = () => {
  const [state, setState] = useState<State>(INITIAL_STATE);
  const device = useSelector(getCurrentDevice);
  const dispatch = useDispatch();
  // Making sure at least one account exists, if not, redirecting to the add account modal
  const accounts = useSelector(accountsSelector);

  const { stepId, isAddressVerified, verifyAddressError } = state;

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
    setStepId(INITIAL_STATE.stepId);
    setIsAddressVerified(INITIAL_STATE.isAddressVerified);
    setVerifyAddressError(INITIAL_STATE.verifyAddressError);
  };

  const handleChangeAddressVerified = (isAddressVerified?: boolean | null, err?: Error | null) => {
    if (err && err.name !== "UserRefusedAddress") {
      logger.critical(err);
    }
    setIsAddressVerified(isAddressVerified);
    setVerifyAddressError(err);
  };

  const hasAccounts = !!accounts.length;

  const openAddAccounts = useCallback(() => {
    dispatch(closeModal("MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION"));
    dispatch(
      openModal("MODAL_ADD_ACCOUNTS", {
        currency: null,
      }),
    );
  }, [dispatch]);

  useEffect(() => {
    if (!hasAccounts) {
      openAddAccounts();
    }
  }, [hasAccounts, openAddAccounts]);

  if (!hasAccounts) return null;

  const isAssociationLock = ["associationDevice", "associationConfirmation"].includes(stepId);
  const isReceiveLock = stepId === "receive" && isAddressVerified === null;
  const isModalLocked = isAssociationLock || isReceiveLock;

  return (
    <Modal
      name="MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION"
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
        />
      )}
    />
  );
};

export default ReceiveWithAssociationModal;
