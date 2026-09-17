import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import { NavigatorName, ScreenName } from "~/const";
import NeuronValidationError from "../NeuronManageFlow/ValidationError";
import StakingValidationError from "../StakingFlow/ValidationError";

const goBack = jest.fn();
const navigate = jest.fn();
const popTo = jest.fn();
const pop = jest.fn();
const replace = jest.fn();
const navigation = { goBack, navigate, popTo, getParent: () => ({ pop, replace }) };

jest.mock("~/components/PreventNativeBack", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: "icp-prevent-native-back" }),
  };
});

const named = (name: string) => Object.assign(new Error(name), { name });

const renderNeuron = (params: Record<string, unknown>) =>
  render(
    <NeuronValidationError
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={navigation as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params } as any}
    />,
  );

const renderStaking = (params: Record<string, unknown>) =>
  render(
    <StakingValidationError
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={navigation as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params } as any}
    />,
  );

describe("ValidationError", () => {
  beforeEach(() => {
    goBack.mockClear();
    navigate.mockClear();
    popTo.mockClear();
    pop.mockClear();
    replace.mockClear();
  });

  it("shows the error both flows arrived with", () => {
    renderNeuron({ error: named("ICPCallUnconfirmed"), transaction: { type: "follow" } });

    expect(screen.getByText("Outcome unknown")).toBeVisible();
  });

  // Close leaves the flow entirely, which means popping the parent navigator, not this stack.
  it("sends Close out of the flow rather than back a step", () => {
    renderNeuron({ error: named("ICPCallUnconfirmed"), transaction: { type: "follow" } });

    fireEvent.press(screen.getByText("Close"));

    expect(pop).toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
  });

  // Both flows render the same component; only the analytics and the fallback differ, so nothing else
  // distinguishes them if the wrappers stop passing their own values.
  it("serves the staking flow from the same screen", () => {
    renderStaking({ error: named("UserRefusedOnDevice"), transaction: { type: "create_neuron" } });

    expect(screen.getByText("Retry")).toBeVisible();
  });

  // Where a retry is safe the flow is not over, so the staking failure keeps Retry and does not also
  // offer an exit that would discard it.
  it("keeps a retryable staking failure inside its own flow", () => {
    renderStaking({ error: named("UserRefusedOnDevice"), transaction: { type: "create_neuron" } });

    expect(screen.getByText("Retry")).toBeVisible();
    expect(screen.queryByText("Back to neurons")).toBeNull();
  });
});

/*
 * Retry belongs at the step that collected the input, so a value that needs correcting can be
 * corrected. Before this it always went back one screen — the device screen — which re-signed the
 * same wrong value.
 */
describe("ValidationError retry routing", () => {
  beforeEach(() => {
    goBack.mockClear();
    navigate.mockClear();
    popTo.mockClear();
  });

  // `navigate` would push a second copy of the screen rather than return to it, and `popTo` replaces
  // the target's params, so the params have to travel with the call — the screens fault on an
  // account they cannot read.
  it("returns to the screen that collected the action's input, carrying its params", () => {
    const params = {
      error: named("ICPCallRejected"),
      transaction: { type: "stake_maturity" },
      accountId: "account-1",
      neuronId: "7",
    };

    renderNeuron(params);
    fireEvent.press(screen.getByText("Retry"));

    expect(popTo).toHaveBeenCalledWith(ScreenName.InternetComputerNeuronStakeMaturity, params);
    expect(navigate).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
  });

  // The topic is already chosen; the followee list it holds is what a retry is likely correcting.
  it("returns a follow to the followee list, not the topic picker", () => {
    renderNeuron({ error: named("ICPCallRejected"), transaction: { type: "follow" } });

    fireEvent.press(screen.getByText("Retry"));

    expect(popTo).toHaveBeenCalledWith(
      ScreenName.InternetComputerNeuronFollowees,
      expect.anything(),
    );
  });

  // Both dissolve-delay commands are entered on the same screen.
  it("returns either dissolve-delay command to the delay screen", () => {
    renderNeuron({
      error: named("ICPCallRejected"),
      transaction: { type: "increase_dissolve_delay" },
    });

    fireEvent.press(screen.getByText("Retry"));

    expect(popTo).toHaveBeenCalledWith(
      ScreenName.InternetComputerNeuronSetDissolveDelay,
      expect.anything(),
    );
  });

  /*
   * The confirmation list is the one retry target that need not be in the stack: a neuron's own
   * Confirm following goes straight to the device, so the retry is the first time the list mounts
   * and there is nothing to pop back to. `popTo` puts it in place of this screen, which only works
   * because the account travels with the call.
   */
  it("carries the account to a confirmation list that was never mounted", () => {
    renderNeuron({
      error: named("ICPCallRejected"),
      transaction: { type: "refresh_voting_power" },
      accountId: "account-1",
    });

    fireEvent.press(screen.getByText("Retry"));

    expect(popTo).toHaveBeenCalledWith(
      ScreenName.InternetComputerNeuronRefreshVotingPower,
      expect.objectContaining({ accountId: "account-1" }),
    );
  });

  it("goes back one screen for an action that took no input", () => {
    renderNeuron({ error: named("ICPCallRejected"), transaction: { type: "start_dissolving" } });

    fireEvent.press(screen.getByText("Retry"));

    expect(goBack).toHaveBeenCalled();
    expect(popTo).not.toHaveBeenCalled();
  });

  /*
   * The retry targets are screens in the manage navigator, so only that flow supplies them. A map
   * keyed on the transaction type alone would have let a staking transaction reuse a manage-flow key
   * and `popTo` a screen the staking navigator never registered; the staking flow retries in place
   * instead.
   */
  it("never pops the staking flow to a screen only the manage flow registers", () => {
    renderStaking({ error: named("ICPCallRejected"), transaction: { type: "increase_stake" } });

    fireEvent.press(screen.getByText("Retry"));

    expect(popTo).not.toHaveBeenCalled();
    expect(goBack).toHaveBeenCalled();
  });
});

/*
 * Re-signing is not a redelivery: the expiry is minted when the call is built, so a retry carries a
 * new request id the IC's de-duplication does not match. Both copies can execute, which for an
 * additive command means the change applies twice.
 */
describe("ValidationError withholding an unsafe retry", () => {
  beforeEach(() => {
    goBack.mockClear();
    navigate.mockClear();
    popTo.mockClear();
    replace.mockClear();
  });

  it("withholds Retry when a non-repeatable command may already have run", () => {
    renderNeuron({
      error: named("ICPCallUnconfirmed"),
      transaction: { type: "increase_dissolve_delay" },
      signed: true,
    });

    expect(screen.queryByText("Retry")).toBeNull();
    expect(screen.getByText("Back to neurons")).toBeVisible();
  });

  /*
   * Hiding the button is only half of it. This screen replaced the device screen, so Android's
   * hardware Back pops to SelectDevice, which auto-selects the last device and signs the same
   * command again — the one outcome the withholding exists to prevent.
   */
  it("blocks hardware Back when it refused a retry", () => {
    renderNeuron({
      error: named("ICPCallUnconfirmed"),
      transaction: { type: "increase_dissolve_delay" },
      signed: true,
    });

    expect(screen.getByTestId("icp-prevent-native-back")).toBeVisible();
  });

  // Where a retry is offered, Back does what Retry does, so there is nothing to protect.
  it("leaves Back alone when a retry is safe", () => {
    renderNeuron({
      error: named("ICPCallRejected"),
      transaction: { type: "increase_dissolve_delay" },
      signed: true,
    });

    expect(screen.getByText("Retry")).toBeVisible();
    expect(screen.queryByTestId("icp-prevent-native-back")).toBeNull();
  });

  it("sends that user to the list, where Refresh neurons is", () => {
    renderNeuron({
      error: named("ICPCallUnconfirmed"),
      transaction: { type: "increase_dissolve_delay" },
      signed: true,
      accountId: "account-1",
    });

    fireEvent.press(screen.getByText("Back to neurons"));

    expect(popTo).toHaveBeenCalledWith(ScreenName.InternetComputerNeuronList, {
      accountId: "account-1",
      parentId: undefined,
    });
  });

  it("offers Retry when the signature never left the device", () => {
    renderNeuron({
      error: named("UserRefusedOnDevice"),
      transaction: { type: "increase_dissolve_delay" },
    });

    expect(screen.getByText("Retry")).toBeVisible();
    expect(screen.queryByText("Back to neurons")).toBeNull();
  });

  it("offers Retry when the network reported that nothing ran", () => {
    renderNeuron({
      error: named("ICPGovernanceRejected"),
      transaction: { type: "increase_dissolve_delay" },
      signed: true,
    });

    expect(screen.getByText("Retry")).toBeVisible();
  });

  it("offers Retry for a command that repeats harmlessly", () => {
    renderNeuron({
      error: named("ICPCallUnconfirmed"),
      transaction: { type: "follow" },
      signed: true,
    });

    expect(screen.getByText("Retry")).toBeVisible();
  });

  /*
   * The staking flow used to supply no fallback, on the argument that closing it lands on the account
   * page, which carries the same entry point as a banner. That argument was wrong: a create_neuron
   * leaves the neuron snapshot empty, so the banner the user lands on still reads "Stake ICP" and the
   * only exit from an unaccounted-for stake invited a second one. The neuron list holds Refresh
   * neurons, the one thing that settles whether the first took effect.
   */
  it("sends a refused staking retry to the neurons, not back to the stake banner", () => {
    renderStaking({
      error: named("ICPCallUnconfirmed"),
      transaction: { type: "create_neuron" },
      signed: true,
      accountId: "account-1",
    });

    expect(screen.queryByText("Retry")).toBeNull();
    expect(screen.getByText("Close")).toBeVisible();

    fireEvent.press(screen.getByText("Back to neurons"));

    // A sibling navigator, so this leaves the staking flow rather than moving inside it.
    expect(replace).toHaveBeenCalledWith(NavigatorName.InternetComputerNeuronManageFlow, {
      screen: ScreenName.InternetComputerNeuronList,
      params: { accountId: "account-1", parentId: undefined },
    });
  });
});
