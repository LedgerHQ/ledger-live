import React, { PureComponent } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";

type State = {
  stepId: StepId;
};
const INITIAL_STATE: { stepId: StepId } = {
  stepId: "validator",
};

export type DelegationModalProps = {
  account: CardanoAccount;
};

class DelegationModal extends PureComponent<DelegationModalProps, State> {
  state = INITIAL_STATE;
  handleReset = () => {
    return this.setState({
      ...INITIAL_STATE,
    });
  };

  handleStepChange = (stepId: StepId) =>
    this.setState({
      stepId,
    });

  render() {
    const { stepId } = this.state;
    const isModalLocked = ["connectDevice", "confirmation"].includes(stepId);
    return (
      <Modal
        name="MODAL_CARDANO_DELEGATE"
        centered
        onHide={this.handleReset}
        preventBackdropClick={isModalLocked}
        width={550}
        render={({ onClose, data }) => (
          <Body
            stepId={stepId}
            name="MODAL_CARDANO_DELEGATE"
            onClose={onClose}
            onChangeStepId={this.handleStepChange}
            params={data || {}}
          />
        )}
      />
    );
  }
}
export default DelegationModal;
