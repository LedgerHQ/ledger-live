// @flow

import React, { PureComponent } from "react";
import { getNodeList } from "@ledgerhq/live-common/families/hedera/api/mirror";

import Modal from "~/renderer/components/Modal";

import Body from "./Body";

import type { Option } from "~/renderer/components/Select";
import type { StepId } from "./types";

type State = {
  stepId: StepId,
  nodeListOptions: Option[],
};

const INITIAL_STATE = {
  stepId: "stake",
  nodeListOptions: [],
};

class StakeModal extends PureComponent<{ name: string }, State> {
  state = INITIAL_STATE;

  handleReset = () => this.setState(INITIAL_STATE);

  handleStepChange = (stepId: StepId) => this.setState({ stepId });

  async componentDidMount() {
    // fetch list of stake-able nodes
    const nodeList = (await getNodeList()).map(node => ({
      description: node.description,
      label: node.node_account_id,
      value: node.node_id,
      stake: node.stake,
      rewarding: node.stake > node.min_stake
    }));

    this.setState({ nodeListOptions: nodeList });
  }

  render() {
    const { stepId } = this.state;
    const { name } = this.props;

    const isModalLocked = ["summary", "connectDevice"].includes(stepId);

    return (
      <Modal
        name={name}
        centered
        refocusWhenChange={stepId}
        onHide={this.handleReset}
        preventBackdropClick={isModalLocked}
        // NOTE: `data` is stuff passed when invoking `openModal` in `AccountHeaderManageActions`
        render={({ data }) => (
          <Body
            stepId={stepId}
            name={name}
            onChangeStepId={this.handleStepChange}
            params={{ ...data, name, nodeListOptions: this.state.nodeListOptions }}
          />
        )}
      />
    );
  }
}

export default StakeModal;