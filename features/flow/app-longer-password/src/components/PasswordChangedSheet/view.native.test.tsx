import { I18nTestProvider } from "@shared/i18n/testing";
import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import type { PasswordChangedSheetProps } from "./types";
import { PasswordChangedSheet } from "./view";

const COPY = {
  en: {
    translation: {
      "appLock.longerPassword.changed.title": "Password changed",
      "appLock.longerPassword.changed.cta": "Got it",
    },
  },
};

const DONE = "app-lock-password-changed-done";

const renderSheet = (props: Partial<PasswordChangedSheetProps> = {}) => {
  const onDone = jest.fn();

  render(
    <I18nTestProvider resources={COPY}>
      <PasswordChangedSheet isOpen onDone={onDone} {...props} />
    </I18nTestProvider>,
  );

  return { onDone, user: userEvent.setup() };
};

describe("PasswordChangedSheet", () => {
  it("confirms the change and closes from its button", async () => {
    const { onDone, user } = renderSheet();

    expect(screen.getByText("Password changed")).toBeTruthy();
    await user.press(screen.getByTestId(DONE));

    expect(onDone).toHaveBeenCalled();
  });

  it("shows nothing while closed", () => {
    renderSheet({ isOpen: false });

    expect(screen.queryByTestId(DONE)).toBeNull();
  });
});
