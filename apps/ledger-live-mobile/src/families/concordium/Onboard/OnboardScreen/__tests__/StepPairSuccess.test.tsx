import React from "react";
import { render, screen, userEvent } from "@tests/test-renderer";
import StepPairSuccess from "../components/StepPairSuccess";

describe("StepPairSuccess", () => {
  const onContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render success alert", () => {
    render(<StepPairSuccess onContinue={onContinue} />);
    expect(screen.getByText("Successfully connected to Concordium ID App.")).toBeDefined();
  });

  it("should call onContinue when Continue button is pressed", async () => {
    render(<StepPairSuccess onContinue={onContinue} />);

    await userEvent.press(screen.getByText("Continue"));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
