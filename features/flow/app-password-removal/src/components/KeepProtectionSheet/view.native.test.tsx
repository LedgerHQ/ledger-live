import { I18nTestProvider } from "@shared/i18n/testing";
import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import type { KeepProtectionSheetProps } from "./types";
import { KeepProtectionSheet } from "./view";

const COPY = {
  en: {
    translation: {
      "auth.enableBiometrics.faceid": "Face ID",
      "appLock.keepProtection.password.title": "You can't turn off your password",
      "appLock.keepProtection.password.description": "You need a password or biometrics.",
      "appLock.keepProtection.biometrics.title": "You can't turn off {{biometricsType}}",
      "appLock.keepProtection.biometrics.description": "You need {{biometricsType}} or a password.",
      "appLock.keepProtection.cta": "Got it",
    },
  },
};

const DISMISS = "app-lock-keep-protection-dismiss";

const renderSheet = (props: Partial<KeepProtectionSheetProps> = {}) => {
  const onClose = jest.fn();

  render(
    <I18nTestProvider resources={COPY}>
      <KeepProtectionSheet isOpen protection="password" onClose={onClose} {...props} />
    </I18nTestProvider>,
  );

  return { onClose, user: userEvent.setup() };
};

describe("KeepProtectionSheet", () => {
  it("explains why the password has to stay", () => {
    renderSheet();

    expect(screen.getByText("You can't turn off your password")).toBeTruthy();
    expect(screen.getByText("You need a password or biometrics.")).toBeTruthy();
  });

  it("names the device's own biometrics", () => {
    renderSheet({ protection: "biometrics", biometricsKind: "FaceID" });

    expect(screen.getByText("You can't turn off Face ID")).toBeTruthy();
    expect(screen.getByText("You need Face ID or a password.")).toBeTruthy();
  });

  it("closes from its button", async () => {
    const { onClose, user } = renderSheet();

    await user.press(screen.getByTestId(DISMISS));

    expect(onClose).toHaveBeenCalled();
  });

  it("shows nothing while closed", () => {
    renderSheet({ isOpen: false });

    expect(screen.queryByTestId(DISMISS)).toBeNull();
  });
});
