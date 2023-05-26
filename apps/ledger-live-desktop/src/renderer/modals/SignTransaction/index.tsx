import React, { useState } from "react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal, { RenderProps } from "~/renderer/components/Modal";
import Body, { Params } from "./Body";
import { StepId } from "./types";
type Props = {
  stepId: StepId;
  canEditFees: boolean;
  error?: Error;
};
const SignTransactionModal = ({ stepId }: Props) => {
  const [state, setState] = useState({
    stepId: stepId || "summary",
    error: undefined as Error | undefined,
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
        onHide={handleReset}
        preventBackdropClick
        render={({ onClose, data }: RenderProps<Params>) => (
          <Body
            stepId={state.stepId}
            onClose={() => {
              if (data.onCancel) {
                data.onCancel(state.error || new Error("Signature interrupted by user"));
              }
              onClose?.();
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
