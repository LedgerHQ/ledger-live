import React, { PureComponent } from "react";
import { StepId } from "./types";
import Modal from "~/renderer/components/Modal";
import Body, { Data } from "./Body";

type State = {
  stepId: StepId;
};

class SendModal extends PureComponent<Data, State> {
  state: State = {
    stepId: "starter",
  };

  handleReset = () =>
    this.setState({
      stepId: "starter",
    });

  handleStepChange = (stepId: StepId) => {
    this.setState({
      stepId,
    });
  };

  render() {
    const { stepId } = this.state;
    const isModalLocked = ["account", "confirmation"].includes(stepId);
    return (
      <Modal
        name="MODAL_DELEGATE"
        centered
        onHide={this.handleReset}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }) => (
          <Body
            stepId={stepId}
            onClose={onClose}
            onChangeStepId={this.handleStepChange}
            params={data || {}}
          />
        )}
      />
    );
  }
}
export default SendModal;
