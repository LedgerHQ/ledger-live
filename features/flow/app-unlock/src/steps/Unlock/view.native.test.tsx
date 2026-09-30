import { I18nTestProvider } from "@shared/i18n/testing";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import { Keyboard } from "react-native";
import type { UnlockViewProps } from "./types";
import { UnlockView } from "./view";

const COPY = {
  en: {
    translation: {
      "appLock.field.label": "Password",
      "appLock.field.reveal": "Show password",
      "appLock.field.hide": "Hide password",
      "appLock.unlock.retryBiometrics": "Use Face ID",
      "appLock.unlock.cta": "Unlock",
      "appLock.unlock.unlockCta": "Unlock with Face ID",
      "appLock.unlock.forgotPassword": "Forgot password?",
      "appLock.unlock.wrongPassword": "Wrong password",
      "appLock.unlock.failed": "Something went wrong",
    },
  },
};

const SCREEN = "app-lock-unlock-screen";
const FIELD = "app-lock-unlock-field";
const SUBMIT = "app-lock-unlock-submit";
const FORGOT = "app-lock-unlock-forgot-password";
const RETRY = "app-lock-unlock-retry-biometrics";

let keyboardListeners: Record<string, () => void> = {};
const dismiss = jest.fn();

beforeEach(() => {
  keyboardListeners = {};
  Object.assign(Keyboard, {
    dismiss,
    addListener: jest.fn((event: string, listener: () => void) => {
      keyboardListeners[event] = listener;
      return { remove: jest.fn() };
    }),
  });
  dismiss.mockClear();
});

const renderView = (props: Partial<UnlockViewProps> = {}) => {
  const handlers = {
    onPasswordChange: jest.fn(),
    onUnlock: jest.fn(),
    onRetryBiometrics: jest.fn(),
  };

  render(
    <I18nTestProvider resources={COPY}>
      <UnlockView
        password=""
        isUnlockEnabled
        hasWrongPassword={false}
        isVerifying={false}
        canRetryBiometrics={false}
        {...handlers}
        {...props}
      />
    </I18nTestProvider>,
  );

  return { ...handlers, user: userEvent.setup() };
};

describe("UnlockView, asking for the password", () => {
  it("unlocks from its button", async () => {
    const { onUnlock, user } = renderView();

    expect(screen.getByTestId(FIELD)).toBeTruthy();
    await user.press(screen.getByTestId(SUBMIT));

    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("holds the button while the password cannot be checked yet, and spins while it is", () => {
    renderView({ isUnlockEnabled: false, isVerifying: true });

    expect(screen.getByTestId(SUBMIT).props.disabled).toBe(true);
    expect(screen.getByTestId(SUBMIT).props.loading).toBe(true);
  });

  it("says the password was wrong", () => {
    renderView({ hasWrongPassword: true });

    expect(screen.getByTestId(FIELD).props.helperText).toBe("Wrong password");
    expect(screen.getByTestId(FIELD).props.status).toBe("error");
  });

  it("says the check failed rather than that the password was wrong", () => {
    renderView({ hasWrongPassword: true, hasFailed: true });

    expect(screen.getByTestId(FIELD).props.helperText).toBe("Something went wrong");
  });

  it("stays neutral before any attempt", () => {
    renderView();

    expect(screen.getByTestId(FIELD).props.helperText).toBeUndefined();
    expect(screen.getByTestId(FIELD).props.status).toBeUndefined();
  });

  it("offers the forgotten password sheet only when there is one to open", async () => {
    const onForgotPassword = jest.fn();
    const { user } = renderView({ onForgotPassword });

    await user.press(screen.getByTestId(FORGOT));

    expect(onForgotPassword).toHaveBeenCalledTimes(1);
  });

  it("leaves the forgotten password link out without a sheet", () => {
    renderView();

    expect(screen.queryByTestId(FORGOT)).toBeNull();
  });

  it("offers biometrics from the field when a retry is possible", () => {
    renderView({ canRetryBiometrics: true, biometricsKind: "FaceID" });

    const suffix = screen.getByTestId(FIELD).props.suffix as React.ReactElement<{
      testID?: string;
    }>;
    expect(suffix.props.testID).toBe(`${FIELD}-biometrics`);
  });

  it("keeps clear of the keyboard, and of the home indicator without it", () => {
    renderView({ keyboardHeight: 300, bottomInset: 34 });
    expect(screen.getByTestId(SCREEN).props.style.paddingBottom).toBe(316);
  });

  it("keeps at least the base margin at the bottom", () => {
    renderView({ bottomInset: 0 });
    expect(screen.getByTestId(SCREEN).props.style.paddingBottom).toBe(16);
  });

  it("puts the keyboard away while the field cannot be typed into", () => {
    renderView({ isForgotPasswordOpen: true });

    expect(dismiss).toHaveBeenCalled();
  });

  it("stops treating the field as focused once the keyboard is gone", () => {
    renderView();

    expect(() =>
      act(() => {
        keyboardListeners.keyboardDidHide?.();
      }),
    ).not.toThrow();
  });
});

describe("UnlockView, standing in for the splash", () => {
  it("shows the mark alone while the biometrics prompt is up", () => {
    renderView({ isAwaitingBiometrics: true, canRetryBiometrics: true });

    expect(screen.getByTestId(SCREEN)).toBeTruthy();
    expect(screen.queryByTestId(FIELD)).toBeNull();
    expect(screen.queryByTestId(RETRY)).toBeNull();
  });

  it("offers to try biometrics again once the prompt has gone", async () => {
    const { onRetryBiometrics, user } = renderView({
      hasPassword: false,
      canRetryBiometrics: true,
    });

    await user.press(screen.getByTestId(RETRY));

    expect(onRetryBiometrics).toHaveBeenCalledTimes(1);
  });

  it("offers nothing to press when biometrics cannot be retried", () => {
    renderView({ hasPassword: false });

    expect(screen.queryByTestId(RETRY)).toBeNull();
    expect(screen.queryByTestId(FIELD)).toBeNull();
  });
});
