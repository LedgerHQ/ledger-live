import React, { useState } from "react";
import Modal from "~/renderer/components/Modal";
import logger from "~/renderer/logger";
import Body from "./Body";
import { StepId } from "./types";

type State = {
  stepId: StepId;
  isUfvkExported: boolean;
  ufvkExportError: Error | undefined | null;
};

const INITIAL_STATE: State = {
  stepId: "intro",
  isUfvkExported: false,
  ufvkExportError: null,
};

const ExportKeyModal = () => {
  const [state, setState] = useState<State>(() => INITIAL_STATE);

  const setIsUfvkExported = (newIsUfvkExported: State["isUfvkExported"]) => {
    setState(prevState => ({ ...prevState, isUfvkExported: newIsUfvkExported }));
  };

  const setExportError = (newExportError: State["ufvkExportError"]) => {
    setState(prevState => ({ ...prevState, ufvkExportError: newExportError }));
  };

  const onHandleReset = () => setState({ ...INITIAL_STATE });

  const onHandleStepChange = (stepId: StepId) =>
    setState(currentState => ({ ...currentState, stepId }));

  const onHandleUfvkExported = (isUfvkExported: boolean, error?: Error | undefined | null) => {
    if (error && error.name !== "UserRefusedAddress") {
      logger.critical(error);
    }
    setIsUfvkExported(isUfvkExported);
    setExportError(error);
  };

  const { stepId } = state;
  const isModalLocked = ["device", "export", "confirmation"].includes(stepId);

  return (
    <Modal
      name="MODAL_ZCASH_EXPORT_KEY"
      centered
      onHide={onHandleReset}
      preventBackdropClick={isModalLocked}
      width={550}
      render={({ onClose, data }) => (
        <Body
          stepId={stepId}
          isUfvkExported={state.isUfvkExported}
          ufvkExportError={state.ufvkExportError}
          onClose={onClose}
          onChangeStepId={onHandleStepChange}
          onChangeUfvkExported={onHandleUfvkExported}
          params={data ?? {}}
        />
      )}
    />
  );
};

export default ExportKeyModal;
