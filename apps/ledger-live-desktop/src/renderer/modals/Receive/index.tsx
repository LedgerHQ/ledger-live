import React, { useState, useCallback, useEffect } from "react";
import logger from "~/renderer/logger";
import Modal from "~/renderer/components/Modal";
import Body, { StepId } from "./Body";
import { useDispatch, useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal, closeModal } from "~/renderer/actions/modals";

type State = {
  stepId: StepId;
  isAddressVerified: boolean | undefined | null;
  verifyAddressError: Error | undefined | null;
};

const INITIAL_STATE = {
  stepId: "account" as StepId,
  isAddressVerified: null,
  verifyAddressError: null,
};
const ReceiveModal = () => {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const { stepId, isAddressVerified, verifyAddressError } = state;

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

  // Making sure at least one account exists, if not, redirecting to the add account modal
  const accounts = useSelector(accountsSelector);

  const dispatch = useDispatch();
  const hasAccounts = !!accounts.length;

  const openAddAccounts = useCallback(() => {
    dispatch(closeModal("MODAL_RECEIVE"));
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
        />
      )}
    />
  );
};

export default ReceiveModal;
