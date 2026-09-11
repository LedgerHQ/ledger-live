import React from "react";
import { render, screen } from "@tests/test-renderer";
import { RatioPicker } from "../index";

const renderPicker = (props: Partial<React.ComponentProps<typeof RatioPicker>> = {}) => {
  const onChange = jest.fn();
  const onMax = jest.fn();
  const { user } = render(
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
  return { onChange, onMax, user };
};

describe("RatioPicker", () => {
  it("fills the field with the pressed share of the maximum", async () => {
    const { onChange, user } = renderPicker();

    await user.press(screen.getByTestId("ratio-25%"));

    expect(onChange).toHaveBeenCalledWith(25);
  });

  it("rounds the share down to the allowed precision", async () => {
    const { onChange, user } = renderPicker({ maxValue: 10.005, decimalPlaces: 2 });

    await user.press(screen.getByTestId("ratio-50%"));

    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("delegates the max pill to its own handler", async () => {
    const { onMax, onChange, user } = renderPicker();

    await user.press(screen.getByTestId("ratio-MAX"));

    expect(onMax).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables the pill whose value the field already holds", async () => {
    const { onChange, user } = renderPicker({ value: 50 });

    await user.press(screen.getByTestId("ratio-50%"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables the max pill once the field holds the whole balance", async () => {
    const { onMax, user } = renderPicker({ value: 100 });

    await user.press(screen.getByTestId("ratio-MAX"));

    expect(onMax).not.toHaveBeenCalled();
  });

  it("disables every pill when there is nothing to spend", async () => {
    const { onChange, onMax, user } = renderPicker({ maxValue: 0 });

    await user.press(screen.getByTestId("ratio-25%"));
    await user.press(screen.getByTestId("ratio-MAX"));

    expect(onChange).not.toHaveBeenCalled();
    expect(onMax).not.toHaveBeenCalled();
  });
});
