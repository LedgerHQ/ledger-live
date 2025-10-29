import React, { useState } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import { Account } from "@ledgerhq/types-live";

type State = {
  stepId: StepId;
};

const INITIAL_STATE: State = {
  stepId: "validator",
};

export type Props = {
  account: Account;
};

const StakingModal: React.FC<Props> = ({ account }) => {
  const [stepId, setStepId] = useState<StepId>(INITIAL_STATE.stepId);

  const handleReset = () => setStepId(INITIAL_STATE.stepId);

  const handleStepChange = (stepId: StepId) => setStepId(stepId);

  const isModalLocked = ["connectDevice", "confirmation"].includes(stepId);

  return (
    <Modal
      name="MODAL_MINA_STAKE"
      centered
      onHide={handleReset}
      preventBackdropClick={isModalLocked}
      width={stepId !== "confirmation" ? 600 : 500}
      render={({ onClose }) => (
        <Body
          stepId={stepId}
          onClose={onClose}
          onChangeStepId={handleStepChange}
          params={{ account }}
        />
      )}
    />
  );
};

export default StakingModal;
