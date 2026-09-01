import React, { PureComponent } from "react";
import Modal from "~/renderer/components/Modal";
import { ModalData } from "~/renderer/modals/types";

type BodyProps<Data, StepId> = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (stepId: StepId) => void;
  params: Data;
};

export function createStakingFlowModal<Name extends keyof ModalData, StepId extends string>({
  name,
  initialStepId,
  Body,
}: {
  name: Name;
  initialStepId: StepId;
  Body: React.ComponentType<BodyProps<ModalData[Name], StepId>>;
}) {
  type State = { stepId: StepId };
  const INITIAL_STATE: State = { stepId: initialStepId };

  // The modal takes no props: its data arrives from the redux modal state through
  // Modal's `render` callback below, the same way SelfTransferModal works. Typing the
  // props as ModalData[Name] wrongly demanded `account` at every render site.
  class StakingFlowModal extends PureComponent<Record<string, never>, State> {
    state: State = INITIAL_STATE;
    handleReset = () => this.setState({ ...INITIAL_STATE });
    handleStepChange = (stepId: StepId) => this.setState({ stepId });

    render() {
      const { stepId } = this.state;
      const isModalLocked = (["connectDevice", "confirmation"] as StepId[]).includes(stepId);
      return (
        <Modal
          name={name}
          centered
          onHide={this.handleReset}
          preventBackdropClick={isModalLocked}
          width={550}
          render={({ onClose, data }) => (
            <Body
              stepId={stepId}
              onClose={onClose}
              onChangeStepId={this.handleStepChange}
              params={data || ({} as ModalData[Name])}
            />
          )}
        />
      );
    }
  }

  return StakingFlowModal;
}
