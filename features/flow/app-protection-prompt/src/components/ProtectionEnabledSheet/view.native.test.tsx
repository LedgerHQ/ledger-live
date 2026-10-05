import { I18nTestProvider } from "@shared/i18n/testing";
import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import type { ProtectionEnabledSheetProps } from "./types";
import { ProtectionEnabledSheet } from "./view";

const COPY = {
  en: {
    translation: {
      "auth.enableBiometrics.faceid": "Face ID",
      "appLock.protectionEnabled.biometrics.title": "{{biometricsType}} enabled",
      "appLock.protectionEnabled.password.title": "Password created",
      "appLock.protectionEnabled.description": "You can now sign up to get a card",
      "appLock.protectionEnabled.cta": "Continue",
    },
  },
};

const CONTINUE = "app-lock-protection-enabled-continue";

const renderSheet = (props: Partial<ProtectionEnabledSheetProps> = {}) => {
  const handlers = { onContinue: jest.fn(), onClose: jest.fn() };

  render(
    <I18nTestProvider resources={COPY}>
      <ProtectionEnabledSheet
        isOpen
        variant="biometrics"
        biometricsKind="FaceID"
        {...handlers}
        {...props}
      />
    </I18nTestProvider>,
  );

  return { ...handlers, user: userEvent.setup() };
};

describe("ProtectionEnabledSheet", () => {
  it("names the biometrics that were enabled", () => {
    renderSheet();

    expect(screen.getByText("Face ID enabled")).toBeTruthy();
    expect(screen.getByText("You can now sign up to get a card")).toBeTruthy();
  });

  it("confirms a created password", () => {
    renderSheet({ variant: "password", biometricsKind: undefined });

    expect(screen.getByText("Password created")).toBeTruthy();
  });

  it("prefers the caller's reason over its own", () => {
    renderSheet({ reason: "You can now finish your card sign-up." });

    expect(screen.getByText("You can now finish your card sign-up.")).toBeTruthy();
    expect(screen.queryByText("You can now sign up to get a card")).toBeNull();
  });

  it("continues from its button", async () => {
    const { onContinue, user } = renderSheet();

    await user.press(screen.getByTestId(CONTINUE));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("shows nothing while closed", () => {
    renderSheet({ isOpen: false });

    expect(screen.queryByTestId(CONTINUE)).toBeNull();
  });
});
