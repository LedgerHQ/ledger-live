import React, { PureComponent } from "react";
import Modal from "~/renderer/components/Modal";
import Body, { Data } from "./Body";
import { StepId } from "./types";

interface State {
  stepId: StepId;
}
const INITIAL_STATE: State = {
  stepId: "claimRewards",
};
class ClaimRewardsModal extends PureComponent<Data, State> {
  state: State = INITIAL_STATE;
  handleReset = () => this.setState({ ...INITIAL_STATE });

  handleStepChange = (stepId: StepId) =>
    this.setState({
      stepId,
    });

  render() {
    const { stepId } = this.state;

    const isModalLocked = ["connectDevice", "confirmation"].includes(stepId);
    return (
      <Modal
        name="MODAL_MULTIVERSX_CLAIM_REWARDS"
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
export default ClaimRewardsModal;
