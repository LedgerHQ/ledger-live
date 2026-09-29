import { track } from "@shared/analytics";
import { act, fireEvent, render, screen, withFlagOverrides } from "@tests/test-renderer";
import React from "react";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AuthSecurityToggle from "~/screens/Settings/General/AuthSecurityToggle";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  getBiometricsAvailability: jest.fn(async () => ({ status: "available", kind: "FaceID" })),
  promptBiometrics: jest.fn(async () => ({ status: "succeeded" })),
  clearBiometricsMarker: jest.fn(async () => true),
  storeBiometricsMarker: jest.fn(async () => true),
}));

jest.mock("@features/platform-card", () => ({
  ...jest.requireActual("@features/platform-card"),
  getCardSessionToken: jest.fn(async () => null),
}));

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return { ...actual, useNavigation: () => ({ navigate: jest.fn() }) };
});

const protectedBy = (protection: Partial<State["appLock"]>) =>
  withFlagOverrides({ lwmPasswordRevamp: { enabled: true } }, (state: State) => ({
    ...state,
    appLock: { ...state.appLock, isHydrated: true, ...protection },
  }));

const flip = async (testID: string, next: boolean) => {
  const toggle = await screen.findByTestId(testID);

  await act(async () => {
    fireEvent(toggle, "valueChange", next);
  });
};

beforeEach(() => jest.clearAllMocks());

describe("tracking the protection toggles", () => {
  it.each([
    { hasPassword: false, next: true },
    { hasPassword: true, next: false },
  ])(
    "reports the password toggle as it was before the tap, from $hasPassword",
    async ({ hasPassword, next }) => {
      render(<AuthSecurityToggle />, {
        overrideInitialState: protectedBy({ hasPassword, biometricsEnabled: true }),
      });

      await flip("password-settings-switch", next);

      expect(track).toHaveBeenCalledWith("toggle_clicked", {
        toggle: "Password Lock",
        page: ScreenName.GeneralSettings,
        enabled: hasPassword,
      });
    },
  );

  it.each([
    { biometricsEnabled: false, next: true },
    { biometricsEnabled: true, next: false },
  ])(
    "reports the biometrics toggle as it was before the tap, from $biometricsEnabled",
    async ({ biometricsEnabled, next }) => {
      render(<AuthSecurityToggle />, {
        overrideInitialState: protectedBy({ hasPassword: true, biometricsEnabled }),
      });

      await flip("biometrics-settings-switch", next);

      expect(track).toHaveBeenCalledWith("toggle_clicked", {
        toggle: "biometrics",
        page: ScreenName.GeneralSettings,
        enabled: biometricsEnabled,
      });
    },
  );
});
