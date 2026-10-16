import React from "react";
import { render, screen } from "tests/testSetup";
import { RatioPicker } from "../RatioPicker";

const baseProps = {
  value: 0,
  maxValue: 100,
  maxBuffer: 1,
  decimalPlaces: 2,
  onChange: jest.fn(),
  onMax: jest.fn(),
  testIdPrefix: "perps-test",
};

describe("RatioPicker", () => {
  it("sets the amount from a ratio of the max", async () => {
    const onChange = jest.fn();
    const { user } = render(<RatioPicker {...baseProps} onChange={onChange} />);

    await user.click(screen.getByTestId("perps-test-ratio-50%"));

    expect(onChange).toHaveBeenCalledWith(50);
  });

  it("calls onMax from the MAX pill", async () => {
    const onMax = jest.fn();
    const { user } = render(<RatioPicker {...baseProps} onMax={onMax} />);

    await user.click(screen.getByTestId("perps-test-ratio-MAX"));

    expect(onMax).toHaveBeenCalledTimes(1);
  });

  it("disables the pill matching the current amount, and MAX once the buffer is applied", () => {
    render(<RatioPicker {...baseProps} value={99} />);

    expect(screen.getByTestId("perps-test-ratio-MAX")).toBeDisabled();
    expect(screen.getByTestId("perps-test-ratio-25%")).toBeEnabled();
  });

  it("disables every pill when there is nothing to withdraw or deposit", () => {
    render(<RatioPicker {...baseProps} maxValue={0} />);

    expect(screen.getByTestId("perps-test-ratio-25%")).toBeDisabled();
    expect(screen.getByTestId("perps-test-ratio-MAX")).toBeDisabled();
  });
});
