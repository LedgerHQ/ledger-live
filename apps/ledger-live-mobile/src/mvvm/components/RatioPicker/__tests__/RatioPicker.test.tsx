import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { RatioPicker } from "../index";

const renderPicker = (props: Partial<React.ComponentProps<typeof RatioPicker>> = {}) => {
  const onChange = jest.fn();
  const onMax = jest.fn();
  render(
    <RatioPicker
      value={0}
      maxValue={100}
      decimalPlaces={2}
      onChange={onChange}
      onMax={onMax}
      testIDPrefix="ratio"
      {...props}
    />,
  );
  return { onChange, onMax };
};

describe("RatioPicker", () => {
  it("fills the field with the pressed share of the maximum", () => {
    const { onChange } = renderPicker();

    fireEvent.press(screen.getByTestId("ratio-25%"));

    expect(onChange).toHaveBeenCalledWith(25);
  });

  it("rounds the share down to the allowed precision", () => {
    const { onChange } = renderPicker({ maxValue: 10.005, decimalPlaces: 2 });

    fireEvent.press(screen.getByTestId("ratio-50%"));

    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("delegates the max pill to its own handler", () => {
    const { onMax, onChange } = renderPicker();

    fireEvent.press(screen.getByTestId("ratio-MAX"));

    expect(onMax).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables the pill whose value the field already holds", () => {
    const { onChange } = renderPicker({ value: 50 });

    fireEvent.press(screen.getByTestId("ratio-50%"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables the max pill once the field holds the whole balance", () => {
    const { onMax } = renderPicker({ value: 100 });

    fireEvent.press(screen.getByTestId("ratio-MAX"));

    expect(onMax).not.toHaveBeenCalled();
  });

  it("disables every pill when there is nothing to spend", () => {
    const { onChange, onMax } = renderPicker({ maxValue: 0 });

    fireEvent.press(screen.getByTestId("ratio-25%"));
    fireEvent.press(screen.getByTestId("ratio-MAX"));

    expect(onChange).not.toHaveBeenCalled();
    expect(onMax).not.toHaveBeenCalled();
  });
});
