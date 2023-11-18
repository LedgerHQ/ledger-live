import React, { useCallback, useState } from "react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";

type Props = {
  stepId?: StepId;
  onClose?: () => void;
};
const MODAL_LOCKED: {
  [key in StepId]: boolean;
} = {
  recipient: false,
  amount: true,
  summary: true,
  device: true,
  confirmation: true,
  warning: false,
};
const SendModal = ({ stepId: initialStepId, onClose }: Props) => {
  const [stepId, setStep] = useState(() => initialStepId || "recipient");
  const handleReset = useCallback(() => setStep("recipient"), []);
  const handleStepChange = useCallback((stepId: StepId) => setStep(stepId), []);
  const isModalLocked = MODAL_LOCKED[stepId as StepId];
  return (
    <DomainServiceProvider>
      <Modal
        name="MODAL_SEND"
        centered
        onHide={handleReset}
        onClose={onClose}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }) => (
          <Body
            stepId={stepId}
            onClose={onClose}
            onChangeStepId={handleStepChange}
            params={data || {}}
          />
        )}
      />
    </DomainServiceProvider>
  );
};
export default SendModal;
