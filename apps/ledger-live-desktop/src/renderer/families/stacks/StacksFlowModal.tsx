import React, { useCallback, useState } from "react";
import Modal from "~/renderer/components/Modal";
import type { ModalData } from "~/renderer/modals/types";

type StacksFlowModalName = "MODAL_STACKS_STAKE" | "MODAL_STACKS_UNSTAKE";

export type StacksFlowBodyProps<S extends string, D> = {
  stepId: S;
  onClose: () => void;
  onChangeStepId: (stepId: S) => void;
  params: D;
};

type Props<N extends StacksFlowModalName, S extends string> = {
  name: N;
  initialStepId: S;
  Body: React.ComponentType<StacksFlowBodyProps<S, ModalData[N]>>;
};

// A stray backdrop click must not dismiss the flow once the device is involved.
const LOCKED_STEPS: ReadonlySet<string> = new Set(["connectDevice", "confirmation"]);

export default function StacksFlowModal<N extends StacksFlowModalName, S extends string>({
  name,
  initialStepId,
  Body,
}: Readonly<Props<N, S>>) {
  const [stepId, setStepId] = useState<S>(initialStepId);
  const handleReset = useCallback(() => setStepId(initialStepId), [initialStepId]);

  return (
    <Modal
      name={name}
      centered
      onHide={handleReset}
      preventBackdropClick={LOCKED_STEPS.has(stepId)}
      render={({ onClose, data }) => (
        <Body
          stepId={stepId}
          onClose={onClose}
          onChangeStepId={setStepId}
          params={(data ?? {}) as ModalData[N]}
        />
      )}
    />
  );
}
