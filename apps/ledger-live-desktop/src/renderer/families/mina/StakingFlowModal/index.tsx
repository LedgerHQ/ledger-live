import React, { PureComponent } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import { Account } from "@ledgerhq/types-live";

type State = {
  stepId: StepId;
};

const INITIAL_STATE: State = {
  stepId: "validator",
};

export type Props = {
  account: Account;
};

class StakingModal extends PureComponent<Props, State> {
  state: State = INITIAL_STATE;

  handleReset = () => this.setState({ ...INITIAL_STATE });

  handleStepChange = (stepId: StepId) =>
    this.setState({
      stepId,
    });

  render() {
    const { stepId } = this.state;
    const { account } = this.props;

    const isModalLocked = ["connectDevice", "confirmation"].includes(stepId);

    return (
      <Modal
        name="MODAL_MINA_STAKE"
        centered
        onHide={this.handleReset}
        preventBackdropClick={isModalLocked}
        width={stepId !== "confirmation" ? 600 : 500}
        render={({ onClose }) => (
          <Body
            stepId={stepId}
            onClose={onClose}
            onChangeStepId={this.handleStepChange}
            params={{ account }}
          />
        )}
      />
    );
  }
}

export default StakingModal;
