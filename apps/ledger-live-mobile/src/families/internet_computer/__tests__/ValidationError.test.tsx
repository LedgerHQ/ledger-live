import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import NeuronValidationError from "../NeuronManageFlow/ValidationError";
import StakingValidationError from "../StakingFlow/ValidationError";

const goBack = jest.fn();
const pop = jest.fn();
const navigation = { goBack, getParent: () => ({ pop }) };

const error = Object.assign(new Error("ICPCallUnconfirmed"), { name: "ICPCallUnconfirmed" });

const renderNeuron = () =>
  render(
    <NeuronValidationError
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={navigation as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params: { error, transaction: { type: "follow" } } } as any}
    />,
  );

const renderStaking = () =>
  render(
    <StakingValidationError
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={navigation as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params: { error } } as any}
    />,
  );

describe("ValidationError", () => {
  beforeEach(() => {
    goBack.mockClear();
    pop.mockClear();
  });

  it("shows the error both flows arrived with", () => {
    renderNeuron();

    expect(screen.getByText("Outcome unknown")).toBeVisible();
  });

  // Retry belongs to the failed step, so it goes back one screen rather than leaving the flow.
  it("sends Retry back to the step that failed", () => {
    renderNeuron();

    fireEvent.press(screen.getByText("Retry"));

    expect(goBack).toHaveBeenCalled();
    expect(pop).not.toHaveBeenCalled();
  });

  // Close leaves the flow entirely, which means popping the parent navigator, not this stack.
  it("sends Close out of the flow rather than back a step", () => {
    renderNeuron();

    fireEvent.press(screen.getByText("Close"));

    expect(pop).toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
  });

  // Both flows render the same component; only the analytics differ, so nothing else distinguishes
  // them if the wrappers stop passing their own values.
  it("serves the staking flow from the same screen", () => {
    renderStaking();

    expect(screen.getByText("Outcome unknown")).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
  });
});
