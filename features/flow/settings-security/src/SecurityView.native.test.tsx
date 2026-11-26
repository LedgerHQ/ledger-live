import React from "react";
import { fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import { SettingsPortProvider } from "@features/flow-settings";
import { track } from "@shared/analytics";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { createFakeLinking } from "./__tests__/fakeLinking";
import { createFakeSecurityPort } from "./__tests__/fakeSecurityPort";
import { Security } from "./Security";
import { SECURITY_URLS } from "./urls";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));
jest.mock("@shared/analytics-react", () => ({ Track: () => null }));

// The Lumen switch is stubbed in package tests: its change event is fired, a press does nothing.
const toggle = (testID: string, value: boolean) =>
  fireEvent(screen.getByTestId(testID), "checkedChange", value);

function renderSecurity(initial?: Parameters<typeof createFakeSecurityPort>[0]) {
  const fake = createFakeSecurityPort(initial);
  const { openExternal, LinkingWrapper } = createFakeLinking();
  render(
    <I18nWrapper>
      <LinkingWrapper>
        <SettingsPortProvider value={fake.port}>
          <Security testID="settings-security" />
        </SettingsPortProvider>
      </LinkingWrapper>
    </I18nWrapper>,
  );
  return { ...fake, openExternal, user: userEvent.setup() };
}

describe("Security on mobile", () => {
  beforeEach(() => jest.mocked(track).mockClear());

  it("shows hide balance, App lock and MEV protection, without the desktop rows", () => {
    renderSecurity({ passwordSet: true });

    expect(screen.getByText("Hide balance")).toBeVisible();
    expect(screen.getByText("App lock")).toBeVisible();
    expect(screen.getByText("MEV protection")).toBeVisible();
    expect(screen.queryByText("Auto-lock")).toBeNull();
    expect(screen.queryByText("Change password")).toBeNull();
  });

  it("names the biometrics row after what the device offers", () => {
    renderSecurity({ biometricKind: "faceId" });

    expect(screen.getByText("Face ID")).toBeVisible();
    expect(screen.getByText("Use Face ID to open the app.")).toBeVisible();
  });

  it("tells to turn on App lock while the biometrics row waits for a password", () => {
    renderSecurity({
      biometricKind: "faceId",
      biometricsRequirePassword: true,
      passwordSet: false,
    });

    expect(screen.getByText('To enable Face ID, turn on "App lock".')).toBeVisible();
    expect(screen.queryByText("Use Face ID to open the app.")).toBeNull();
  });

  it("has no biometrics row on a device without biometrics", () => {
    renderSecurity({ biometricKind: null });

    expect(screen.queryByTestId("setting-biometrics")).toBeNull();
  });

  it("changes the biometrics from its toggle", () => {
    const { updates } = renderSecurity({ biometricKind: "touchId" });

    toggle("setting-biometrics-toggle", true);

    expect(updates).toEqual([{ key: "biometricsEnabled", value: true }]);
  });

  it("disables the biometrics toggle while it waits for a password", () => {
    renderSecurity({
      biometricKind: "touchId",
      biometricsRequirePassword: true,
      passwordSet: false,
    });

    expect(screen.getByTestId("setting-biometrics-toggle")).toHaveProp("disabled", true);
  });

  it("asks the app to start the password flow from the App lock toggle", () => {
    const { requestAppLock } = renderSecurity({ passwordSet: false });

    toggle("setting-appLock-toggle", true);

    expect(requestAppLock.mock.calls).toEqual([["set"]]);
  });

  it("changes hide balance and tracks the discreet mode toggle", () => {
    const { updates } = renderSecurity();

    toggle("setting-hideBalance-toggle", true);

    expect(updates).toEqual([{ key: "hideBalance", value: true }]);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Discreet mode",
      toggle: "ON",
    });
  });

  it("opens the MEV protection page from Learn more", async () => {
    const { user, openExternal } = renderSecurity();

    await user.press(screen.getByText("Learn more"));

    expect(openExternal.mock.calls).toEqual([[SECURITY_URLS.mevProtection]]);
  });
});
