import React from "react";
import { render, screen, userEvent } from "@tests/test-renderer";
import StepFinish from "../components/StepFinish";

describe("StepFinish", () => {
  const onDone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render success alert", () => {
    render(<StepFinish onDone={onDone} />);
    expect(
      screen.getByText("Your Concordium account has been created successfully."),
    ).toBeDefined();
  });

  it("should call onDone when Done button is pressed", async () => {
    render(<StepFinish onDone={onDone} />);

    await userEvent.press(screen.getByText("Done"));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
