import React, { PureComponent } from "react";
import Modal from "~/renderer/components/Modal";
import Body, { Data } from "./Body";
import { StepId } from "./types";
type State = {
  stepId: StepId;
};
const INITIAL_STATE: State = {
  stepId: "castNominations",
};
class NominationModal extends PureComponent<Data, State> {
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
        name="MODAL_POLKADOT_NOMINATE"
        centered
        onHide={this.handleReset}
        preventBackdropClick={isModalLocked}
        width={720}
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
export default NominationModal;
