import { PasswordDraftProvider } from "@features/platform-app-lock";
import { I18nTestProvider } from "@shared/i18n/testing";
import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import type { LongerPasswordViewProps } from "./types";
import { LongerPasswordView } from "./view";

jest.mock("@shared/analytics-react", () => ({ TrackScreen: () => null }));

const COPY = {
  en: {
    translation: {
      appLock: {
        field: {
          label: "Password",
          reveal: "Show password",
          hide: "Hide password",
          minLength: "At least 6 characters",
        },
        setupPassword: { cta: "Continue" },
        confirmPassword: {
          cta: "Confirm",
          mismatch: "Passwords don't match",
          saveFailed: "We couldn't save your password",
        },
        longerPassword: {
          prompt: { title: "Change your password", description: "At least 6.", cta: "Change" },
          enter: { title: "Enter new password" },
          confirm: { title: "Confirm new password" },
          changed: { title: "Password changed", cta: "Got it" },
        },
      },
    },
  },
};

const OVERLAY = "app-lock-longer-password-overlay";

const view = (props: LongerPasswordViewProps) => (
  <I18nTestProvider resources={COPY}>
    <PasswordDraftProvider>
      <LongerPasswordView {...props} />
    </PasswordDraftProvider>
  </I18nTestProvider>
);

const renderView = (props: Partial<LongerPasswordViewProps> = {}) => {
  const handlers = {
    onChangeRequested: jest.fn(),
    onPromptHidden: jest.fn(),
    onEntered: jest.fn(),
    onConfirmed: jest.fn(async () => undefined),
    onDone: jest.fn(),
  };
  const all = { step: "prompt" as const, hasSaveFailed: false, ...handlers, ...props };
  const rendered = render(view(all));

  return {
    ...handlers,
    rerenderWith: (next: Partial<LongerPasswordViewProps>) =>
      rendered.rerender(view({ ...all, ...next })),
    user: userEvent.setup(),
  };
};

describe("LongerPasswordView", () => {
  it("opens on the prompt and asks for the change from it", async () => {
    const { onChangeRequested, user } = renderView();

    expect(screen.getByText("Change your password")).toBeTruthy();
    expect(screen.queryByTestId(OVERLAY)).toBeNull();

    await user.press(screen.getByTestId("app-lock-change-password-confirm"));

    expect(onChangeRequested).toHaveBeenCalledTimes(1);
  });

  it("keeps the prompt mounted while it closes", () => {
    renderView({ step: "closing" });

    expect(screen.getByTestId("app-lock-change-password-sheet")).toBeTruthy();
    expect(screen.queryByTestId(OVERLAY)).toBeNull();
  });

  it("takes the new password, then its confirmation", async () => {
    const { onEntered, onConfirmed, rerenderWith, user } = renderView({ step: "enter" });

    expect(screen.getByText("Enter new password")).toBeTruthy();
    await user.type(screen.getByTestId("app-lock-setup-password-field"), "longenough");
    await user.press(screen.getByTestId("app-lock-setup-password-continue"));
    expect(onEntered).toHaveBeenCalledTimes(1);

    rerenderWith({ step: "confirm" });

    expect(screen.getByText("Confirm new password")).toBeTruthy();
    await user.type(screen.getByTestId("app-lock-confirm-password-field"), "longenough");
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));
    expect(onConfirmed).toHaveBeenCalledWith("longenough");
  });

  it("says when the new password could not be stored", () => {
    renderView({ step: "confirm", hasSaveFailed: true });

    expect(screen.getByTestId("app-lock-confirm-password-field").props.helperText).toBe(
      "We couldn't save your password",
    );
  });

  it("clears the status bar", () => {
    renderView({ step: "enter", topInset: 47 });

    expect(screen.getByTestId(OVERLAY).props.style.paddingTop).toBe(47);
  });

  it("acknowledges the change", async () => {
    const { onDone, user } = renderView({ step: "done" });

    expect(screen.getByText("Password changed")).toBeTruthy();
    await user.press(screen.getByTestId("app-lock-password-changed-done"));

    expect(onDone).toHaveBeenCalled();
  });
});
