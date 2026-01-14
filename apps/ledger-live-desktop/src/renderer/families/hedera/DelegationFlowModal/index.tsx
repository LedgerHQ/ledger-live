import React, { useCallback, useState } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import type { StepId } from "./types";

const initialStep: StepId = "validator";
const lockedSteps: Set<StepId> = new Set(["connectDevice", "confirmation"]);

function DelegationModal() {
  const [stepId, setStepId] = useState<StepId>(initialStep);

  const isModalLocked = lockedSteps.has(stepId);

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
