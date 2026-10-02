import { I18nTestProvider } from "@shared/i18n/testing";
import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import type { DeactivatePasswordViewProps } from "./types";
import { DeactivatePasswordView } from "./view";

const COPY = {
  en: {
    translation: {
      "appLock.field.label": "Password",
      "appLock.field.reveal": "Show password",
      "appLock.field.hide": "Hide password",
      "appLock.deactivatePassword.wrongPassword": "Incorrect password",
      "appLock.deactivatePassword.failed": "We couldn't deactivate your password.",
      "appLock.deactivatePassword.cta": "Confirm",
    },
  },
};

const FIELD = "app-lock-deactivate-password-field";
const CONFIRM = "app-lock-deactivate-password-confirm";

const renderView = (props: Partial<DeactivatePasswordViewProps> = {}) => {
  const handlers = { onPasswordChange: jest.fn(), onConfirm: jest.fn(async () => undefined) };

  render(
    <I18nTestProvider resources={COPY}>
      <DeactivatePasswordView
        password=""
        isConfirmEnabled
        hasWrongPassword={false}
        isSubmitting={false}
        {...handlers}
        {...props}
      />
    </I18nTestProvider>,
  );

  return { ...handlers, user: userEvent.setup() };
};

describe("DeactivatePasswordView", () => {
  it("stays neutral before any attempt", () => {
    renderView();

    expect(screen.getByTestId(FIELD).props.helperText).toBeUndefined();
    expect(screen.getByTestId(FIELD).props.status).toBeUndefined();
    expect(screen.getByText("Confirm")).toBeTruthy();
  });

  it("confirms from its button", async () => {
    const { onConfirm, user } = renderView();

    await user.press(screen.getByTestId(CONFIRM));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("holds the button while nothing can be confirmed, and spins while it is", () => {
    renderView({ isConfirmEnabled: false, isSubmitting: true });

    expect(screen.getByTestId(CONFIRM).props.disabled).toBe(true);
    expect(screen.getByTestId(CONFIRM).props.loading).toBe(true);
  });

  it("says the password was wrong", () => {
    renderView({ hasWrongPassword: true });

    expect(screen.getByTestId(FIELD).props.helperText).toBe("Incorrect password");
    expect(screen.getByTestId(FIELD).props.status).toBe("error");
  });

  it("says the removal failed rather than that the password was wrong", () => {
    renderView({ hasWrongPassword: true, hasFailed: true });

    expect(screen.getByTestId(FIELD).props.helperText).toBe(
      "We couldn't deactivate your password.",
    );
    expect(screen.getByTestId(FIELD).props.status).toBe("error");
  });

  it("keeps clear of the keyboard", () => {
    renderView({ keyboardHeight: 300 });

    expect(screen.root.props.style.paddingBottom).toBe(316);
  });
});
