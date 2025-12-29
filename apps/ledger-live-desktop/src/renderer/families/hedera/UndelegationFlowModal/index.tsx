import React, { useCallback, useState } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import type { StepId } from "./types";

const initialStep: StepId = "summary";
const lockedSteps: Set<StepId> = new Set(["connectDevice", "confirmation"]);

function UndelegationModal() {
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
