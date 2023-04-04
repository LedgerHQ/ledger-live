import React, { useState, useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
interface Props {
  name: string;
}
const UndelegationModal = (props: Props) => {
  const { name } = props;
  const [stepId, setStepId] = useState<StepId>("amount");
  const onHide = useCallback(() => {
    setStepId("amount");
  }, []);
  const onChange = useCallback((id: string) => {
    setStepId(id);
  }, []);
  const isModalLocked = ["device", "confirmation"].includes(stepId);
  return (
    <Modal
      name={name}
      centered={true}
      refocusWhenChange={stepId}
      onHide={onHide}
      preventBackdropClick={isModalLocked}
      render={({ onClose, data }) => (
        <Body
          account={data.account}
          stepId={stepId}
          name={name}
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
