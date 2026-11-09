import React, { useState } from "react";
import Modal from "~/renderer/components/Modal";
import Body, { getAction, getSteps } from "./Body";
import { StepId } from "./types";

const LOCKED_STEPS = new Set<StepId>(["connectDevice", "confirmation"]);

export default function AddTokenModal() {
  const [stepId, setStepId] = useState<StepId | null>(null);

  return (
    <Modal
      name="MODAL_XRP_ADD_TOKEN"
      centered
      onHide={() => setStepId(null)}
      preventBackdropClick={!!stepId && LOCKED_STEPS.has(stepId)}
      render={({ onClose, data }) => (
        <Body
          stepId={stepId ?? getSteps(getAction(data), data.tokenAccount?.token)[0].id}
          onClose={onClose}
          onChangeStepId={setStepId}
          params={data}
        />
      )}
    />
  );
}
