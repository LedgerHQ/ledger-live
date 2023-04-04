import React, { useState, useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
type Props = {
  name: string;
};
export default function UnstakingModal({ name }: Props) {
  const [stepId, setStepId] = useState<StepId>("amount");
  const onHide = useCallback(() => {
    setStepId("amount");
  }, []);
  const onChange = useCallback(id => {
    setStepId(id);
  }, []);
  const isModalLocked = ["device", "confirmation"].includes(stepId);
  return (
    <Modal
      name={name}
      centered
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
          validatorAddress={data.validatorAddress}
        />
      )}
    />
  );
}
