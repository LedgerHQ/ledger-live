// @flow

import React, { PureComponent } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import type { StepId } from "./types";
type State = {
  stepId: StepId;
};

const INITIAL_STATE = {
  stepId: "amount",
};

class UnFreezeModal extends PureComponent<{ name: string }, State> {
  handleStepChange = (stepId: StepId) => this.setState({ stepId });

  handleReset = () =>
    this.setState({
      stepId: "amount",
    });

  render() {
    const { stepId } = this.state;

    const isModalLocked = ["connectDevice", "confirmation"].includes(stepId);

    return (
      <Modal
        name="MODAL_ICON_UNFREEZE"
        centered
        refocusWhenChange={stepId}
        onHide={this.handleReset}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }) => (
          <Body
            stepId={stepId}
            name="MODAL_ICON_UNFREEZE"
            onClose={onClose}
            onChangeStepId={this.handleStepChange}
            params={data || {}}
          />
        )}
      />
    );
  }
}

export default UnFreezeModal;
