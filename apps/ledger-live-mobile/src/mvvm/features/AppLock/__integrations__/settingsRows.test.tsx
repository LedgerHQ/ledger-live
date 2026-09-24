import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import React from "react";
import type { State } from "~/reducers/types";
import AuthSecurityToggle from "~/screens/Settings/General/AuthSecurityToggle";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  getBiometricsAvailability: jest.fn(),
}));

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return { ...actual, useNavigation: () => ({ navigate: jest.fn() }) };
});

const { getBiometricsAvailability } = jest.requireMock("@features/platform-app-lock");

const BIOMETRICS_SWITCH = "biometrics-settings-switch";
const PASSWORD_SWITCH = "password-settings-switch";

const revamped = (protection: Partial<State["appLock"]> = {}) =>
  withFlagOverrides({ lwmPasswordRevamp: { enabled: true } }, (state: State) => ({
    ...state,
    appLock: { ...state.appLock, isHydrated: true, hasPassword: false, ...protection },
  }));

beforeEach(() => {
  jest.clearAllMocks();
  getBiometricsAvailability.mockResolvedValue({ status: "available", kind: "FaceID" });
});

describe("the protection rows in Settings", () => {
  it("offers biometrics with no password set", async () => {
    render(<AuthSecurityToggle />, { overrideInitialState: revamped({ hasPassword: false }) });

    expect(await screen.findByTestId(BIOMETRICS_SWITCH)).toBeEnabled();
  });

  it("shows biometrics as on without a password behind it", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: revamped({ hasPassword: false, biometricsEnabled: true }),
    });

    expect(await screen.findByTestId(BIOMETRICS_SWITCH)).toBeChecked();
  });

  it("offers both protections independently", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: revamped({ hasPassword: true, biometricsEnabled: false }),
    });

    // One retry over both: the password row is there on the first render and the biometrics row
    // waits on the availability read, so asserting them in sequence depends on which lands first.
    await waitFor(() => {
      expect(screen.getByTestId(PASSWORD_SWITCH)).toBeChecked();
      expect(screen.getByTestId(BIOMETRICS_SWITCH)).not.toBeChecked();
    });
  });

  // With the flag off and biometrics the only protection, the legacy path locks nothing.
  it("keeps the revamped rows for biometrics alone once the flag goes off", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: (state: State) => ({
        ...state,
        appLock: {
          ...state.appLock,
          isHydrated: true,
          hasPassword: false,
          biometricsEnabled: true,
        },
      }),
    });

    expect(await screen.findByTestId(BIOMETRICS_SWITCH)).toBeChecked();
  });

  it("hides biometrics on a device that has none", async () => {
    getBiometricsAvailability.mockResolvedValue({ status: "unavailable" });

    render(<AuthSecurityToggle />, { overrideInitialState: revamped() });

    expect(await screen.findByTestId(PASSWORD_SWITCH)).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId(BIOMETRICS_SWITCH)).toBeNull());
  });

  it("keeps the password row usable when the availability read rejects", async () => {
    getBiometricsAvailability.mockRejectedValue(new Error("keychain unavailable"));

    render(<AuthSecurityToggle />, { overrideInitialState: revamped() });

    expect(await screen.findByTestId(PASSWORD_SWITCH)).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId(BIOMETRICS_SWITCH)).toBeNull());
  });

  it("hides it where the hardware exists but nothing is enrolled", async () => {
    getBiometricsAvailability.mockResolvedValue({ status: "notEnrolled" });

    render(<AuthSecurityToggle />, { overrideInitialState: revamped() });

    expect(await screen.findByTestId(PASSWORD_SWITCH)).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId(BIOMETRICS_SWITCH)).toBeNull());
  });
});
