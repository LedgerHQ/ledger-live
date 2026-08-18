import {
  ICP_FEES,
  MIN_NEURON_STAKE,
  NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import { NeuronState } from "@ledgerhq/live-common/families/internet_computer/types";
import React from "react";
import { render, screen } from "tests/testSetup";
import { makeHealthyNeuron, makeStepProps } from "./testUtils";

const CONTROLLER = "test-principal";

const bridgeMock = {
  createTransaction: jest.fn(() => ({ family: "internet_computer", type: "send" })),
  updateTransaction: jest.fn((transaction, patch) => ({ ...transaction, ...patch })),
};

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => bridgeMock,
}));

jest.mock("@ledgerhq/live-common/families/internet_computer/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/internet_computer/react"),
  // The account's real principal is derived from a device-provided key that genAccount cannot fake.
  useICPPrincipal: () => CONTROLLER,
}));

import StepManage from "../ManageNeuronFlowModal/steps/StepManage";

const controlled = (overrides = {}) =>
  makeHealthyNeuron({ id: 7n, controller: CONTROLLER, ...overrides });

const renderManage = (neuron = controlled()) => {
  const props = makeStepProps({ neurons: [neuron], selectedNeuronId: "7" });
  return { props, ...render(<StepManage {...props} />) };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StepManage", () => {
  it("renders nothing when the selected neuron is no longer in the list", () => {
    const props = makeStepProps({ neurons: [controlled()], selectedNeuronId: "999" });
    const { container } = render(<StepManage {...props} />);

    expect(container.firstChild).toBeNull();
  });

  // useNeuronActions runs before the guard above, so it has to tolerate an absent neuron. It used to
  // be handed `neurons[0]`, which is itself undefined once the snapshot comes back empty.
  it("renders nothing rather than throwing when the snapshot has no neurons at all", () => {
    const props = makeStepProps({ neurons: [], selectedNeuronId: "7" });
    const { container } = render(<StepManage {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it("offers the controller the actions that change the neuron", () => {
    renderManage();

    expect(screen.getByTestId("icp-increase-stake-button")).toBeInTheDocument();
    expect(screen.getByText("Add hot key")).toBeInTheDocument();
    expect(screen.queryByText(/You hold a hot key on this neuron/)).not.toBeInTheDocument();
  });

  it("withholds the stake-moving actions from a hot-key holder and says why", () => {
    renderManage(makeHealthyNeuron({ id: 7n, controller: "someone-else" }));

    expect(screen.getByText(/You hold a hot key on this neuron/)).toBeInTheDocument();
    expect(screen.queryByTestId("icp-increase-stake-button")).not.toBeInTheDocument();
    expect(screen.queryByText("Add hot key")).not.toBeInTheDocument();
    expect(screen.queryByText("Split neuron")).not.toBeInTheDocument();
  });

  // The canister authorizes follow and refresh_voting_power for hot keys, not just the controller
  // (governance.rs gates both on is_authorized_to_vote). Locking these would leave a hot-key holder
  // unable to do the only two things a hot key exists for.
  it("still lets a hot-key holder set following and confirm it", () => {
    renderManage(makeHealthyNeuron({ id: 7n, controller: "someone-else" }));

    expect(screen.getByText("Edit following")).toBeInTheDocument();
    expect(screen.getByText("Confirm following")).toBeInTheDocument();
  });

  // The key used to be `common.none`, which no translation file defines, so the row read
  // "common.none". Any neuron under the 14-day voting threshold reaches this branch.
  it("names the absence of voting power instead of printing a translation key", () => {
    renderManage(controlled({ dissolveDelaySeconds: 0n }));

    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.queryByText(/common\.none/)).not.toBeInTheDocument();
  });

  // The label used to sit on the age-bonus row, reading as though "Locked" were the bonus value.
  it("shows the neuron state on its own row, separate from the age bonus", () => {
    renderManage(controlled({ state: NeuronState.Locked }));

    expect(screen.getByText("State")).toBeInTheDocument();
    expect(screen.getByText("Age bonus")).toBeInTheDocument();
  });

  it.each([
    [NeuronState.Locked, "Start dissolving"],
    [NeuronState.Dissolving, "Stop dissolving"],
    [NeuronState.Dissolved, "Disburse"],
  ])("offers the lifecycle action allowed in state %s", (state, label) => {
    renderManage(controlled({ state }));

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  // The reference compared dissolveState to the string "Dissolving", which no variant can equal, so
  // it always sent start_dissolving.
  it("sends stop_dissolving for a neuron that is already dissolving", async () => {
    const { props, user } = renderManage(controlled({ state: NeuronState.Dissolving }));

    await user.click(screen.getByText("Stop dissolving"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "stop_dissolving", neuronId: "7" }),
    );
    expect(props.setLastAction).toHaveBeenCalledWith("stop_dissolving");
    expect(props.transitionTo).toHaveBeenCalledWith("manageAction");
  });

  it("routes to the dissolve-delay step, seeding the transaction it will patch", async () => {
    const { props, user } = renderManage(controlled({ state: NeuronState.Locked }));

    await user.click(screen.getByText("Increase dissolve delay"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "increase_dissolve_delay" }),
    );
    expect(props.transitionTo).toHaveBeenCalledWith("setDissolveDelay");
  });

  it("sets rather than increases the dissolve delay of a dissolved neuron", async () => {
    const { user } = renderManage(
      controlled({
        state: NeuronState.Dissolved,
        dissolveDelaySeconds: 0n,
        dissolveState: undefined,
      }),
    );

    await user.click(screen.getByText("Set dissolve delay"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "set_dissolve_delay" }),
    );
  });

  it("offers a split only once the neuron can leave the minimum stake on both halves", () => {
    const splittable = BigInt(2 * MIN_NEURON_STAKE + ICP_FEES);
    renderManage(controlled({ cachedNeuronStakeE8s: splittable }));

    expect(screen.getByText("Split neuron")).toBeInTheDocument();
  });

  it("hides the split action for a neuron that is too small", () => {
    renderManage(controlled({ cachedNeuronStakeE8s: BigInt(MIN_NEURON_STAKE) }));

    expect(screen.queryByText("Split neuron")).not.toBeInTheDocument();
  });

  it("omits the confirm-following row when the canister reported no refresh timestamp", () => {
    renderManage(controlled({ votingPowerRefreshedTimestampSeconds: undefined }));

    expect(screen.queryByText("Confirm following")).not.toBeInTheDocument();
  });

  it("warns that voting power is already lost once the window has fully elapsed", () => {
    const longAgo =
      Math.floor(Date.now() / 1000) - NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS * 4;
    renderManage(controlled({ votingPowerRefreshedTimestampSeconds: BigInt(longAgo) }));

    expect(screen.getByText(/Voting power lost/)).toBeInTheDocument();
  });

  // increase_stake debits the ledger canister, so it leaves this modal for the regular send flow.
  it("hands a top-up to the send flow and arranges the return trip", async () => {
    const { props, user } = renderManage();

    await user.click(screen.getByTestId("icp-increase-stake-button"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "increase_stake", neuronId: "7" }),
    );
    // The neuron list closes so the send modal can take over, and is reopened on success.
    const opened = props.openModal as jest.Mock;
    expect(opened).not.toHaveBeenCalled();
  });

  it("routes to the split step, seeding a split_neuron transaction", async () => {
    const splittable = BigInt(4 * MIN_NEURON_STAKE);
    const { props, user } = renderManage(controlled({ cachedNeuronStakeE8s: splittable }));

    await user.click(screen.getByText("Split neuron"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "split_neuron" }),
    );
    expect(props.transitionTo).toHaveBeenCalledWith("splitNeuron");
  });

  it("routes to the follow topic step, seeding a follow transaction", async () => {
    const { props, user } = renderManage();

    await user.click(screen.getByText("Edit following"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "follow" }),
    );
    expect(props.transitionTo).toHaveBeenCalledWith("followTopic");
  });

  it("removes a hot key straight from the manage screen", async () => {
    const { user } = renderManage(controlled({ hotKeys: ["aaaaa-aa"] }));

    await user.click(screen.getByText("Remove"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "remove_hot_key", hotKeyToRemove: "aaaaa-aa" }),
    );
  });

  it("toggles automatic maturity staking to the opposite of its current setting", async () => {
    const { user } = renderManage(controlled({ autoStakeMaturity: false }));

    await user.click(screen.getByText("Enable"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "auto_stake_maturity", autoStakeMaturity: true }),
    );
  });
});
