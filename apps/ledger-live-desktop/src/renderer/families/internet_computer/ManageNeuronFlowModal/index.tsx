import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "~/renderer/components/Modal";
import Body, { type Data } from "../neuronFlow/Body";
import type { StepId } from "../neuronFlow/types";
import { steps } from "./steps";

export type Props = Data;

// Steps that are mid-signature or already broadcast: closing by accident there is destructive.
const LOCKED_STEPS = new Set<StepId>(["device", "manageAction", "confirmation"]);

const ManageNeuronFlowModal = () => {
  const { t } = useTranslation();
  const [stepId, setStepId] = useState<StepId>("listNeuron");
  const onReset = useCallback(() => setStepId("listNeuron"), []);

  return (
    <Modal
      name="MODAL_ICP_LIST_NEURONS"
      centered
      width={700}
      onHide={onReset}
      preventBackdropClick={LOCKED_STEPS.has(stepId)}
      render={({ onClose, data }) => (
        <Body
          stepId={stepId}
          onClose={onClose}
          onChangeStepId={setStepId}
          params={(data ?? {}) as Data}
          steps={steps}
          title={t("internetComputer.manageNeuronFlow.title")}
          trackEvent="CloseModalIcpManageNeurons"
          signingStepId="manageAction"
        />
      )}
    />
  );
};

export default ManageNeuronFlowModal;
