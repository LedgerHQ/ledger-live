import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "~/renderer/components/Modal";
import Body, { type Data } from "../neuronFlow/Body";
import type { StepId } from "../neuronFlow/types";
import { steps } from "./steps";

export type Props = Data;

const LOCKED_STEPS = new Set<StepId>(["manageAction", "confirmation"]);

const RefreshVotingPowerFlowModal = () => {
  const { t } = useTranslation();
  const [stepId, setStepId] = useState<StepId>("listNeuron");
  const onReset = useCallback(() => setStepId("listNeuron"), []);

  return (
    <Modal
      name="MODAL_ICP_REFRESH_VOTING_POWER"
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
          title={t("internetComputer.refreshVotingPowerFlow.title")}
          trackEvent="CloseModalIcpRefreshVotingPower"
          signingStepId="manageAction"
        />
      )}
    />
  );
};

export default RefreshVotingPowerFlowModal;
