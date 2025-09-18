import React, { useState, useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";

export default function UnstakingModal() {
  const [stepId, setStepId] = useState<StepId>("amount");
  const onHide = useCallback(() => {
    setStepId("amount");
  }, []);
  const onChange = useCallback((id: StepId) => {
    setStepId(id);
  }, []);
  const isModalLocked = ["device", "confirmation"].includes(stepId);
  return (
    <Modal
      name="MODAL_SUI_UNSTAKE"
      centered
      onHide={onHide}
      preventBackdropClick={isModalLocked}
      render={({ onClose, data }) => (
        <Body params={data} stepId={stepId} onClose={onClose} onChangeStepId={onChange} />
      )}
    />
  );
}
