import React, { PureComponent } from "react";
import logger from "~/renderer/logger";
import Modal from "~/renderer/components/Modal";
import Body, { StepId } from "./Body";
type State = {
  stepId: StepId;
  isAddressVerified: boolean | undefined | null;
  verifyAddressError: Error | undefined | null;
};
const INITIAL_STATE = {
  stepId: "account",
  isAddressVerified: null,
  verifyAddressError: null,
};
class ReceiveModal extends PureComponent<{}, State> {
  state = INITIAL_STATE;
  handleReset = () =>
    this.setState({
      ...INITIAL_STATE,
    });

  handleStepChange = (stepId: StepId) =>
    this.setState({
      stepId,
    });

  handleChangeAddressVerified = (isAddressVerified?: boolean | null, err?: Error | null) => {
    if (err && err.name !== "UserRefusedAddress") {
      logger.critical(err);
    }
    this.setState({
      isAddressVerified,
      verifyAddressError: err,
    });
  };

  render() {
    const { stepId, isAddressVerified, verifyAddressError } = this.state;
    const isModalLocked = stepId === "receive" && isAddressVerified === null;
    return (
      <Modal
        name="MODAL_RECEIVE"
        centered
        refocusWhenChange={stepId}
        onHide={this.handleReset}
        preventBackdropClick={isModalLocked}
        render={({ data, onClose }) => (
          <Body
            onClose={onClose}
            stepId={stepId}
            isAddressVerified={isAddressVerified}
            verifyAddressError={verifyAddressError}
            onChangeAddressVerified={this.handleChangeAddressVerified}
            onChangeStepId={this.handleStepChange}
            params={data || {}}
          />
        )}
      />
    );
  }
}
export default ReceiveModal;
