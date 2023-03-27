import React, { useState } from "react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
type Props = {
  stepId: StepId;
  canEditFees: boolean;
  error?: Error;
};
const SignTransactionModal = ({ stepId, canEditFees, error }: Props) => {
  const [state, setState] = useState({
    stepId: stepId || "summary",
    error: undefined,
  });
  const handleReset = () => {
    setState({
      ...state,
      stepId: "summary",
      error: undefined,
    });
  };
  const handleStepChange = (stepId: StepId) =>
    setState({
      ...state,
      stepId,
    });
  const setError = (error?: Error) =>
    setState({
      ...state,
      error,
    });
  return (
    <DomainServiceProvider>
      <Modal
        name="MODAL_SIGN_TRANSACTION"
        centered
        refocusWhenChange={state.stepId}
        onHide={handleReset}
        preventBackdropClick
        render={({ onClose, data }) => (
          <Body
            stepId={state.stepId}
            onClose={() => {
              if (data.onCancel) {
                data.onCancel(state.error || new Error("Signature interrupted by user"));
              }
              onClose();
            }}
            setError={setError}
            onChangeStepId={handleStepChange}
            params={data || {}}
          />
        )}
      />
    </DomainServiceProvider>
  );
};
export default SignTransactionModal;
