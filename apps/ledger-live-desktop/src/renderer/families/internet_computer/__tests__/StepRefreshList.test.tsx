import {
  NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS,
  SECONDS_IN_7_DAYS,
  SECONDS_IN_DAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
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

    expect(
      screen.getByText(/None of your neurons are on a confirmation clock/),
    ).toBeInTheDocument();
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

  // The canister refreshes such a neuron all the same, so the timestamp filter above misses it.
  it("leaves out neurons whose dissolve delay is too short to vote", () => {
    const neurons = [
      makeNeuron({
        id: 1n,
        dissolveDelaySeconds: BigInt(SECONDS_IN_7_DAYS),
        votingPowerRefreshedTimestampSeconds: refreshedAgo(0),
      }),
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

  it("says a neuron inside the decay window is losing power now", () => {
    const neurons = [
      makeHealthyNeuron({
        id: 1n,
        votingPowerRefreshedTimestampSeconds: refreshedAgo(
          NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS + SECONDS_IN_DAY,
        ),
      }),
    ];
    render(<StepRefreshList {...makeStepProps({ neurons })} />);

    expect(screen.getByText(/losing power now/)).toBeInTheDocument();
  });

  // The countdown alone cannot say this: decay only starts in the window's final month. Refreshed
  // 40 days ago lands mid-bucket, so the rendered duration cannot flip on sub-second clock drift.
  it("shows a bare countdown for a neuron that has not started decaying", () => {
    const neurons = [
      makeHealthyNeuron({
        id: 1n,
        votingPowerRefreshedTimestampSeconds: refreshedAgo(40 * SECONDS_IN_DAY),
      }),
    ];
    render(<StepRefreshList {...makeStepProps({ neurons })} />);

    expect(screen.queryByText(/losing power now/)).not.toBeInTheDocument();
    expect(screen.getByText("5 months, 20 days")).toBeInTheDocument();
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

  // This flow's own entry point had no reset, so a confirmation that failed left its error set and
  // the next one showed it — this step renders the error in place of the list.
  it("discards the previous attempt before starting a confirmation", async () => {
    const neurons = [
      makeHealthyNeuron({ id: 77n, votingPowerRefreshedTimestampSeconds: refreshedAgo(0) }),
    ];
    const props = makeStepProps({ neurons });
    const { user } = render(<StepRefreshList {...props} />);

    await user.click(screen.getByTestId("icp-confirm-following-button"));

    expect(props.resetAttempt).toHaveBeenCalled();
  });

  it("shows the failure in place of the list once an attempt has failed", () => {
    const neurons = [
      makeHealthyNeuron({ id: 77n, votingPowerRefreshedTimestampSeconds: refreshedAgo(0) }),
    ];
    render(<StepRefreshList {...makeStepProps({ neurons, error: new Error("boom") })} />);

    expect(screen.queryByTestId("icp-neuron-row")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icp-confirm-following-button")).not.toBeInTheDocument();
  });
});
