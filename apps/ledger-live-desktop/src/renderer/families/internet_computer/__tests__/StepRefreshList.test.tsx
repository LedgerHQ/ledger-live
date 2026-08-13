import { NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS } from "@ledgerhq/live-common/families/internet_computer/consts";
import React from "react";
import { render, screen } from "tests/testSetup";
import { makeHealthyNeuron, makeNeuron, makeStepProps } from "./testUtils";

const bridgeMock = {
  createTransaction: jest.fn(() => ({ family: "internet_computer", type: "send" })),
  updateTransaction: jest.fn((transaction, patch) => ({ ...transaction, ...patch })),
};

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => bridgeMock,
}));

import StepRefreshList from "../RefreshVotingPowerFlowModal/steps/StepRefreshList";

const NOW_SECONDS = Math.floor(Date.now() / 1000);
const refreshedAgo = (seconds: number) => BigInt(NOW_SECONDS - seconds);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StepRefreshList", () => {
  it("shows the empty state when no neuron is on a confirmation clock", () => {
    render(<StepRefreshList {...makeStepProps({ neurons: [makeNeuron()] })} />);

    expect(screen.getByText(/None of your neurons need confirming/)).toBeInTheDocument();
  });

  // A neuron persisted before the decode change has no timestamp; calling it expiring would be a guess.
  it("leaves out neurons the canister reported no refresh timestamp for", () => {
    const neurons = [
      makeNeuron({ id: 1n, votingPowerRefreshedTimestampSeconds: undefined }),
      makeHealthyNeuron({ id: 2n, votingPowerRefreshedTimestampSeconds: refreshedAgo(0) }),
    ];
    render(<StepRefreshList {...makeStepProps({ neurons })} />);

    expect(screen.getAllByTestId("icp-neuron-row")).toHaveLength(1);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("orders the neurons by how soon each loses its voting power", () => {
    const neurons = [
      makeHealthyNeuron({ id: 1n, votingPowerRefreshedTimestampSeconds: refreshedAgo(0) }),
      makeHealthyNeuron({
        id: 2n,
        votingPowerRefreshedTimestampSeconds: refreshedAgo(
          NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS,
        ),
      }),
    ];
    render(<StepRefreshList {...makeStepProps({ neurons })} />);

    const ids = screen.getAllByTestId("icp-neuron-row").map(row => row.textContent?.slice(0, 1));
    expect(ids).toEqual(["2", "1"]);
  });

  it("marks a neuron whose window has fully elapsed as already lost", () => {
    const neurons = [
      makeHealthyNeuron({
        id: 1n,
        votingPowerRefreshedTimestampSeconds: refreshedAgo(
          NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS * 4,
        ),
      }),
    ];
    render(<StepRefreshList {...makeStepProps({ neurons })} />);

    expect(screen.getByText("Already lost")).toBeInTheDocument();
  });

  it("builds a refresh_voting_power transaction for the neuron whose button is clicked", async () => {
    const neurons = [
      makeHealthyNeuron({ id: 77n, votingPowerRefreshedTimestampSeconds: refreshedAgo(0) }),
    ];
    const props = makeStepProps({ neurons });
    const { user } = render(<StepRefreshList {...props} />);

    await user.click(screen.getByTestId("icp-confirm-following-button"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      type: "refresh_voting_power",
      neuronId: "77",
    });
    expect(props.setSelectedNeuronId).toHaveBeenCalledWith("77");
    expect(props.transitionTo).toHaveBeenCalledWith("manageAction");
  });
});
