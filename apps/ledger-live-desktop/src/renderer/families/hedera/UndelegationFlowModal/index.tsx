import React, { useCallback, useState } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";

function UndelegationModal() {
  const initialStep: StepId = "summary";
  const [stepId, setStepId] = useState<StepId>(initialStep);

  const isModalLocked = ["device", "confirmation"].includes(stepId);

  const onHide = useCallback(() => {
    setStepId(initialStep);
  }, []);

  const onChange = useCallback((id: StepId) => {
    setStepId(id);
  }, []);

  return (
    <Modal
      name="MODAL_HEDERA_UNDELEGATION"
      centered
      onHide={onHide}
      preventBackdropClick={isModalLocked}
      render={({ data, onClose }) => (
        <Body params={data} stepId={stepId} onClose={onClose} onChangeStepId={onChange} />
      )}
    />
  );
}

export default UndelegationModal;
