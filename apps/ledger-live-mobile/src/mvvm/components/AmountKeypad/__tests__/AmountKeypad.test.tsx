import React from "react";
import { render, screen } from "@tests/test-renderer";
import { AmountKeypad, KEYPAD_DELETE_KEY } from "../index";

const renderKeypad = (props: Partial<React.ComponentProps<typeof AmountKeypad>> = {}) => {
  const onKeyPress = jest.fn();
  const { user } = render(
    <AmountKeypad
      onKeyPress={onKeyPress}
      testIDPrefix="amount-key"
      deleteAccessibilityLabel="Delete last digit"
      {...props}
    />,
  );
  return { onKeyPress, user };
};

describe("AmountKeypad", () => {
  it("emits the digit that was pressed", async () => {
    const { onKeyPress, user } = renderKeypad();

    await user.press(screen.getByTestId("amount-key-7"));

    expect(onKeyPress).toHaveBeenCalledWith("7");
  });

  it("emits the decimal separator under its own test id", async () => {
    const { onKeyPress, user } = renderKeypad();

    await user.press(screen.getByTestId("amount-key-decimal"));

    expect(onKeyPress).toHaveBeenCalledWith(".");
  });

  it("emits the delete key so the caller can trim the amount", async () => {
    const { onKeyPress, user } = renderKeypad();

    await user.press(screen.getByTestId("amount-key-delete"));

    expect(onKeyPress).toHaveBeenCalledWith(KEYPAD_DELETE_KEY);
  });

  it("labels the delete key for screen readers", () => {
    renderKeypad();

    expect(screen.getByLabelText("Delete last digit")).toBeOnTheScreen();
  });

  it("ignores presses while disabled", async () => {
    const { onKeyPress, user } = renderKeypad({ disabled: true });

    await user.press(screen.getByTestId("amount-key-1"));

    expect(onKeyPress).not.toHaveBeenCalled();
  });

  it("namespaces every key with the given prefix", () => {
    renderKeypad({ testIDPrefix: "send-key" });

    expect(screen.getByTestId("send-key-0")).toBeOnTheScreen();
    expect(screen.getByTestId("send-key-delete")).toBeOnTheScreen();
  });
});
