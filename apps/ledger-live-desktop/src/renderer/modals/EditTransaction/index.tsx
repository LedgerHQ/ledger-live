import React, { useCallback, useState, memo } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";

type Props = {
  stepId: StepId;
  onClose: Function;
};

const EditTransactionModal = ({ stepId: initialStepId, onClose }: Props) => {
  const [stepId, setStep] = useState(() => initialStepId || "method");
  const [isNftSend, setIsNFTSend] = useState(false);
  const handleReset = useCallback(() => setStep("method"), []);
  const handleStepChange = useCallback(stepId => setStep(stepId), []);
  const handleSetIsNFTSend = useCallback(isNftSend => setIsNFTSend(isNftSend), []);
  return (
    <Modal
      name="MODAL_EDIT_TRANSACTION"
      centered
      refocusWhenChange={stepId}
      onHide={handleReset}
      onClose={onClose}
      preventBackdropClick={true}
      render={({ onClose, data }) => (
        <Body
          stepId={stepId}
          onClose={onClose}
          setIsNFTSend={handleSetIsNFTSend}
          isNftSend={isNftSend}
          onChangeStepId={handleStepChange}
          params={data || {}}
        />
      )}
    />
  );
};

export default memo<Props>(EditTransactionModal);
