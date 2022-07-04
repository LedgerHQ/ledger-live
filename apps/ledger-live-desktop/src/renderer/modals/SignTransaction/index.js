// @flow

import React, { useState } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import type { StepId } from "./types";

type Props = {
  stepId: StepId,
  canEditFees: boolean,
  error?: Error,
};

const SignTransactionModal = ({ stepId, canEditFees, error }: Props) => {
  const [stepIdState, setStepIdState] = useState(stepId || "summary");
  const [errorState, setErrorState] = useState(undefined);

  const handleReset = () => {
    setStepIdState("summary");
    setErrorState(undefined);
  };

  const handleStepChange = (stepId: StepId) => {
    setStepIdState(stepId);
  };

  const setError = (error?: Error) => {
    setErrorState(error);
  };

  return (
    <Modal
      name="MODAL_SIGN_TRANSACTION"
      centered
      refocusWhenChange={stepIdState}
      onHide={handleReset}
      preventBackdropClick
      render={({ onClose, data }) => (
        <Body
          stepId={stepIdState}
          onClose={() => {
            if (data.onCancel) {
              data.onCancel(errorState || new Error("Signature interrupted by user"));
            }
            onClose();
          }}
          setError={setError}
          onChangeStepId={handleStepChange}
          params={data || {}}
        />
      )}
    />
  );
};

export default SignTransactionModal;
