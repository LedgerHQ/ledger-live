import React, { useCallback, useState, memo } from "react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal, { RenderProps } from "~/renderer/components/Modal";
import Body, { Data } from "./Body";
import { StepId } from "./types";

type Props = {
  stepId: StepId;
  onClose: () => void;
};

const EditTransactionModal = ({ stepId: initialStepId, onClose }: Props) => {
  const [stepId, setStep] = useState(() => initialStepId || "method");
  const [isNftSend, setIsNFTSend] = useState(false);
  const handleReset = useCallback(() => setStep("method"), []);
  const handleStepChange = useCallback(stepId => setStep(stepId), []);
  const handleSetIsNFTSend = useCallback(isNftSend => setIsNFTSend(isNftSend), []);
  return (
    <DomainServiceProvider>
      <Modal
        name="MODAL_EDIT_TRANSACTION"
        centered
        preventBackdropClick={true}
        onHide={handleReset}
        onClose={onClose}
        render={({ onClose, data }: RenderProps<Data>) => (
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
    </DomainServiceProvider>
  );
};

export default memo<Props>(EditTransactionModal);
