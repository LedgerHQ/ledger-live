import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import { i18nWrapper } from "../../__tests__/i18nWrapper";
import type { SetupPasswordViewProps } from "./types";
import { SetupPasswordView } from "./view";

const FIELD = "app-lock-setup-password-field";
const CONTINUE = "app-lock-setup-password-continue";

const renderView = (props: Partial<SetupPasswordViewProps> = {}) => {
  const handlers = { onPasswordChange: jest.fn(), onContinue: jest.fn() };

  render(<SetupPasswordView password="" isContinueEnabled {...handlers} {...props} />, {
    wrapper: i18nWrapper(),
  });

  return { ...handlers, user: userEvent.setup() };
};

describe("SetupPasswordView", () => {
  it("states the minimum length under the field", () => {
    renderView();

    expect(screen.getByTestId(FIELD).props.helperText).toBe("At least 6 characters");
    expect(screen.getByText("Continue")).toBeTruthy();
  });

  it("continues from its button", async () => {
    const { onContinue, user } = renderView();

    await user.press(screen.getByTestId(CONTINUE));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("holds the button until the password is long enough", () => {
    renderView({ isContinueEnabled: false });

    expect(screen.getByTestId(CONTINUE).props.disabled).toBe(true);
  });

  it("keeps clear of the keyboard when it is up", () => {
    renderView({ keyboardHeight: 300, bottomInset: 34 });

    expect(screen.root.props.style.paddingBottom).toBe(316);
  });

  it("keeps clear of the home indicator, with at least the base margin", () => {
    renderView({ bottomInset: 34 });
    expect(screen.root.props.style.paddingBottom).toBe(34);
  });

  it("keeps the base margin without an inset", () => {
    renderView();
    expect(screen.root.props.style.paddingBottom).toBe(16);
  });
});
