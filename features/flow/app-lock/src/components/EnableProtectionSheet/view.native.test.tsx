import { I18nTestProvider } from "@shared/i18n/testing";
import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import { EnableProtectionSheet } from "./view";
import type { EnableProtectionSheetProps } from "./types";

const COPY = {
  en: {
    translation: {
      "auth.enableBiometrics.faceid": "Face ID",
      "appLock.enableProtection.biometrics.title": "Enable {{biometricsType}}",
      "appLock.enableProtection.biometrics.description":
        "The crypto card requires {{biometricsType}}.",
      "appLock.enableProtection.biometrics.cta": "Enable {{biometricsType}}",
      "appLock.enableProtection.password.title": "Create a password",
      "appLock.enableProtection.password.description": "The crypto card requires a password.",
      "appLock.enableProtection.password.cta": "Create password",
    },
  },
};

const renderSheet = (overrides: Partial<EnableProtectionSheetProps> = {}) => {
  const onConfirm = jest.fn();

  render(
    <I18nTestProvider resources={COPY}>
      <EnableProtectionSheet
        isOpen
        variant="biometrics"
        biometricsKind="FaceID"
        onConfirm={onConfirm}
        onClose={jest.fn()}
        {...overrides}
      />
    </I18nTestProvider>,
  );

  return { onConfirm, user: userEvent.setup() };
};

describe("the enable-protection sheet", () => {
  it("names the device's own biometrics in every line it shows", () => {
    renderSheet();

    // Title and button carry the same words by design, which is why this counts them.
    expect(screen.getAllByText("Enable Face ID")).toHaveLength(2);
    expect(screen.getByText("The crypto card requires Face ID.")).toBeTruthy();
  });

  it("asks for a password where that is the variant", () => {
    renderSheet({ variant: "password", biometricsKind: undefined });

    expect(screen.getByText("Create a password")).toBeTruthy();
    expect(screen.getByText("Create password")).toBeTruthy();
  });

  it("prefers the caller's reason over its own, so it can be asked for from anywhere", () => {
    renderSheet({ reason: "Signing up for a card needs the app protected." });

    expect(screen.getByText("Signing up for a card needs the app protected.")).toBeTruthy();
    expect(screen.queryByText("The crypto card requires Face ID.")).toBeNull();
  });

  it("shows nothing while closed, so a caller cannot read it off the screen", () => {
    renderSheet({ isOpen: false });

    expect(screen.queryByText("Enable Face ID")).toBeNull();
  });

  it("confirms through the button", async () => {
    const { onConfirm, user } = renderSheet();

    await user.press(screen.getByTestId("app-lock-enable-protection-confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
