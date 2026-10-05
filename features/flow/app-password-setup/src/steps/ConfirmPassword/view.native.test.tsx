import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import { i18nWrapper } from "../../__tests__/i18nWrapper";
import type { ConfirmPasswordViewProps } from "./types";
import { ConfirmPasswordView } from "./view";

const FIELD = "app-lock-confirm-password-field";
const CONFIRM = "app-lock-confirm-password-confirm";

const renderView = (props: Partial<ConfirmPasswordViewProps> = {}) => {
  const handlers = { onPasswordChange: jest.fn(), onConfirm: jest.fn(async () => undefined) };

  render(
    <ConfirmPasswordView
      password=""
      isConfirmEnabled
      hasMismatch={false}
      isSaving={false}
      {...handlers}
      {...props}
    />,
    { wrapper: i18nWrapper() },
  );

  return { ...handlers, user: userEvent.setup() };
};

describe("ConfirmPasswordView", () => {
  it("states the minimum length before any attempt", () => {
    renderView();

    expect(screen.getByTestId(FIELD).props.helperText).toBe("At least 6 characters");
    expect(screen.getByTestId(FIELD).props.status).toBeUndefined();
    expect(screen.getByText("Confirm")).toBeTruthy();
  });

  it("confirms from its button", async () => {
    const { onConfirm, user } = renderView();

    await user.press(screen.getByTestId(CONFIRM));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("holds the button until both entries can be compared, and spins while saving", () => {
    renderView({ isConfirmEnabled: false, isSaving: true });

    expect(screen.getByTestId(CONFIRM).props.disabled).toBe(true);
    expect(screen.getByTestId(CONFIRM).props.loading).toBe(true);
  });

  it("says the two entries differ", () => {
    renderView({ hasMismatch: true });

    expect(screen.getByTestId(FIELD).props.helperText).toBe("Passwords don't match");
    expect(screen.getByTestId(FIELD).props.status).toBe("error");
  });

  it("says the password could not be saved rather than that the entries differ", () => {
    renderView({ hasMismatch: true, hasSaveFailed: true });

    expect(screen.getByTestId(FIELD).props.helperText).toBe("We couldn't save your password");
    expect(screen.getByTestId(FIELD).props.status).toBe("error");
  });

  it("keeps clear of the keyboard when it is up", () => {
    renderView({ keyboardHeight: 300, bottomInset: 34 });

    expect(screen.root.props.style.paddingBottom).toBe(316);
  });

  it("keeps the base margin without an inset", () => {
    renderView();

    expect(screen.root.props.style.paddingBottom).toBe(16);
  });
});
