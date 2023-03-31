import React, { PureComponent } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
interface State {
  stepId: StepId;
}
const INITIAL_STATE = {
  stepId: "withdraw",
};
class ClaimRewardsModal extends PureComponent<
  {
    name: string;
  },
  State
> {
  state = INITIAL_STATE;
  handleReset = () =>
    this.setState({
      ...INITIAL_STATE,
    });

  handleStepChange = (stepId: StepId) =>
    this.setState({
      stepId,
    });

  render() {
    const { stepId } = this.state;
    const { name } = this.props;
    const isModalLocked = ["connectDevice", "confirmation"].includes(stepId);
    return (
      <Modal
        name={name}
        centered
        refocusWhenChange={stepId}
        onHide={this.handleReset}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }) => (
          <Body
            stepId={stepId}
            name={name}
            onClose={onClose}
            onChangeStepId={this.handleStepChange}
            params={{
              contract: data.contract,
              account: data.account,
              amount: data.amount,
              unbondings: data.unbondings,
              validator: data.validator,
            }}
          />
        )}
      />
    );
  }
}
export default ClaimRewardsModal;
