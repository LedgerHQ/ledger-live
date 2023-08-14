import React, { useState, useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";

const UndelegationModal = () => {
  const [stepId, setStepId] = useState<StepId>("amount");
  const onHide = useCallback(() => {
    setStepId("amount");
  }, []);
  const onChange = useCallback((id: StepId) => setStepId(id), []);
  const isModalLocked = ["device", "confirmation"].includes(stepId);
  return (
    <Modal
      name="MODAL_ELROND_UNDELEGATE"
      centered={true}
      onHide={onHide}
      preventBackdropClick={isModalLocked}
      render={({ onClose, data }) => (
        <Body
          account={data.account}
          stepId={stepId}
          onClose={onClose}
          onChangeStepId={onChange}
          contract={data.contract}
          validators={data.validators}
          amount={data.amount}
          delegations={data.delegations}
        />
      )}
    />
  );
};
export default UndelegationModal;
