import React, { useCallback, useState } from "react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal, { RenderProps } from "~/renderer/components/Modal";
import Body, { Data } from "./Body";
import { StepId } from "./types";
type Props = {
  stepId: StepId;
  pro?: boolean;
  onClose: () => void;
};
const MODAL_LOCKED: {
  [key in StepId]: boolean;
} = {
  recipient: true,
  amount: true,
  summary: true,
  device: true,
  confirmation: true,
  warning: false,
};
const SendModal = ({ stepId: initialStepId, onClose, pro }: Props) => {
  const [stepId, setStep] = useState(() => initialStepId || "recipient");
  const handleReset = useCallback(() => setStep("recipient"), []);
  const handleStepChange = useCallback(stepId => setStep(stepId), []);
  const isModalLocked = MODAL_LOCKED[stepId as StepId];
  return (
    <DomainServiceProvider>
      <Modal
        name="MODAL_SEND"
        centered
        onHide={handleReset}
        onClose={onClose}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }: RenderProps<Data>) => (
          <Body
            stepId={stepId}
            pro={pro}
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
