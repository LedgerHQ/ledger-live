import React, { useCallback, useState } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";

function DelegationModal() {
  const initialStep: StepId = "validator";
  const [stepId, setStepId] = useState<StepId>(initialStep);

  const isModalLocked = ["connectDevice", "confirmation"].includes(stepId);

  const onHide = useCallback(() => {
    setStepId(initialStep);
  }, []);

  const onChange = useCallback((id: StepId) => {
    setStepId(id);
  }, []);

  return (
    <Modal
      name="MODAL_HEDERA_DELEGATION"
      centered
      onHide={onHide}
      preventBackdropClick={isModalLocked}
      width={550}
      render={({ data, onClose }) => (
        <Body stepId={stepId} onClose={onClose} onChangeStepId={onChange} params={data ?? {}} />
      )}
    />
  );
}

export default DelegationModal;
