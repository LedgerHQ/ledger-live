import { I18nTestProvider } from "@shared/i18n/testing";
import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import type { ChangePasswordSheetProps } from "./types";
import { ChangePasswordSheet } from "./view";

const COPY = {
  en: {
    translation: {
      "appLock.longerPassword.prompt.title": "Change your password",
      "appLock.longerPassword.prompt.description": "Enter a password of at least 6 characters.",
      "appLock.longerPassword.prompt.cta": "Change password",
    },
  },
};

const renderSheet = (props: Partial<ChangePasswordSheetProps> = {}) => {
  const onChange = jest.fn();

  render(
    <I18nTestProvider resources={COPY}>
      <ChangePasswordSheet isOpen onChange={onChange} {...props} />
    </I18nTestProvider>,
  );

  return { onChange, user: userEvent.setup() };
};

describe("ChangePasswordSheet", () => {
  it("asks for a longer password", () => {
    renderSheet();

    expect(screen.getByText("Change your password")).toBeTruthy();
    expect(screen.getByText("Enter a password of at least 6 characters.")).toBeTruthy();
  });

  it("starts the change from its button", async () => {
    const { onChange, user } = renderSheet();

    await user.press(screen.getByTestId("app-lock-change-password-confirm"));

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
