// @flow

import React, { PureComponent } from "react";

import Modal from "~/renderer/components/Modal";

import Body from "./Body";

import type { StepId } from "./types";

type State = {
  stepId: StepId,
};

const INITIAL_STATE = {
  stepId: "confirmation",
};

class StopStakingModal extends PureComponent<{ name: string }, State> {
  state = INITIAL_STATE;

  handleReset = () => this.setState(INITIAL_STATE);

  handleStepChange = (stepId: StepId) => this.setState({ stepId });

  render() {
    const { stepId } = this.state;
    const { name } = this.props;

    const isModalLocked = ["connectDevice"].includes(stepId);

    return (
      <Modal
        name={name}
        centered
        refocusWhenChange={stepId}
        onHide={this.handleReset}
        preventBackdropClick={isModalLocked}
        render={({ data }) => (
          <Body
            stepId={stepId}
            name={name}
            onChangeStepId={this.handleStepChange}
            // NOTE: `data` is stuff passed when invoking `openModal` in `AccountHeaderManageActions`
            params={{ ...data, name }}
          />
        )}
      />
    );
  }
}

export default StopStakingModal;