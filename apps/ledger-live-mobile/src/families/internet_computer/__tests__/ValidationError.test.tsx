import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import { ScreenName } from "~/const";
import NeuronValidationError from "../NeuronManageFlow/ValidationError";
import StakingValidationError from "../StakingFlow/ValidationError";

const goBack = jest.fn();
const navigate = jest.fn();
const pop = jest.fn();
const navigation = { goBack, navigate, getParent: () => ({ pop }) };

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
    pop.mockClear();
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
  });

  it("returns to the screen that collected the action's input", () => {
    renderNeuron({ error: named("ICPCallRejected"), transaction: { type: "stake_maturity" } });

    fireEvent.press(screen.getByText("Retry"));

    expect(navigate).toHaveBeenCalledWith(ScreenName.InternetComputerNeuronStakeMaturity);
    expect(goBack).not.toHaveBeenCalled();
  });

  // The topic is already chosen; the followee list it holds is what a retry is likely correcting.
  it("returns a follow to the followee list, not the topic picker", () => {
    renderNeuron({ error: named("ICPCallRejected"), transaction: { type: "follow" } });

    fireEvent.press(screen.getByText("Retry"));

    expect(navigate).toHaveBeenCalledWith(ScreenName.InternetComputerNeuronFollowees);
  });

  // Both dissolve-delay commands are entered on the same screen.
  it("returns either dissolve-delay command to the delay screen", () => {
    renderNeuron({
      error: named("ICPCallRejected"),
      transaction: { type: "increase_dissolve_delay" },
    });

    fireEvent.press(screen.getByText("Retry"));

    expect(navigate).toHaveBeenCalledWith(ScreenName.InternetComputerNeuronSetDissolveDelay);
  });

  it("goes back one screen for an action that took no input", () => {
    renderNeuron({ error: named("ICPCallRejected"), transaction: { type: "start_dissolving" } });

    fireEvent.press(screen.getByText("Retry"));

    expect(goBack).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
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

  it("sends that user to the list, where Refresh neurons is", () => {
    renderNeuron({
      error: named("ICPCallUnconfirmed"),
      transaction: { type: "increase_dissolve_delay" },
      signed: true,
      accountId: "account-1",
    });

    fireEvent.press(screen.getByText("Back to neurons"));

    expect(navigate).toHaveBeenCalledWith(ScreenName.InternetComputerNeuronList, {
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

  // The staking flow supplies no fallback: closing it lands on the account page, which carries the
  // same entry point as a banner. Withholding Retry must not leave a dead button behind.
  it("leaves the staking flow with Close alone", () => {
    renderStaking({
      error: named("ICPCallUnconfirmed"),
      transaction: { type: "create_neuron" },
      signed: true,
    });

    expect(screen.queryByText("Retry")).toBeNull();
    expect(screen.queryByText("Back to neurons")).toBeNull();
    expect(screen.getByText("Close")).toBeVisible();
  });
});
