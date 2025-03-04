import React, { PureComponent } from "react";
import Modal from "~/renderer/components/Modal";
import  { Body, Data } from "./Body";
// import { StepId } from "./types";
type State = {
  // stepId: StepId;
};
const INITIAL_STATE: State = {
  stepId: "validator",
};
class DelegationModal extends PureComponent<Data, State> {
  state: State = INITIAL_STATE;
  handleReset = () => this.setState({ ...INITIAL_STATE });

  // handleStepChange = (stepId: StepId) =>
  handleStepChange = () =>
    this.setState({
      // stepId,
    });

  render() {
    // const { stepId } = this.state;

    // const isModalLocked = ["connectDevice", "confirmation"].includes(stepId);
    return (
      <Modal
        name="MODAL_COMMON_DELEGATE"
        centered
        onHide={this.handleReset}
        preventBackdropClick={false}//isModalLocked}
        width={750}
        render={({ onClose, data }) => (
          <Body />
        )}
      />
    );
  }
}
export default DelegationModal;
