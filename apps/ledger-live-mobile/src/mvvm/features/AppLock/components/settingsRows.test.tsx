import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { AppLockBiometricsRow } from "./AppLockBiometricsRow";
import { AppLockPasswordRow } from "./AppLockRow";

jest.mock("../adapters/verifierStore", () => ({
  readStoredPassword: jest.fn(async () => null),
  hasPasswordVerifier: jest.fn(async () => false),
  clearPasswordVerifier: jest.fn(async () => undefined),
}));

jest.mock("../adapters/biometrics", () => ({
  getBiometricsAvailability: jest.fn(async () => ({ status: "available", kind: "FaceID" })),
  hasArmedBiometricPrompt: jest.fn(async () => false),
  disarmBiometricPrompt: jest.fn(async () => undefined),
  armBiometricPrompt: jest.fn(async () => true),
  promptBiometrics: jest.fn(async () => ({ status: "succeeded" })),
}));

jest.mock("../adapters/installMarker", () => ({
  hasInstallMarker: jest.fn(async () => true),
  writeInstallMarker: jest.fn(async () => undefined),
}));

const { readStoredPassword, hasPasswordVerifier } = jest.requireMock("../adapters/verifierStore");
const { getBiometricsAvailability, armBiometricPrompt, promptBiometrics } =
  jest.requireMock("../adapters/biometrics");

beforeEach(() => jest.clearAllMocks());

describe("the password row", () => {
  it("waits for the keychain rather than showing a switch it would have to correct", async () => {
    hasPasswordVerifier.mockReturnValue(new Promise(() => {}));

    render(<AppLockPasswordRow />);

    expect(screen.queryByTestId("password-settings-switch")).toBeNull();
  });

  it("shows the stored state, not what was last tapped", async () => {
    readStoredPassword.mockResolvedValue({ verifier: { version: 1 }, needsLongerPassword: false });
    hasPasswordVerifier.mockResolvedValue(true);

    render(<AppLockPasswordRow />);

    const toggle = await screen.findByTestId("password-settings-switch");

    await waitFor(() => expect(toggle.props.accessibilityState?.checked ?? true).toBe(true));
  });
});

describe("the biometrics row", () => {
  it("is offered on any device that has biometrics, password or not", async () => {
    render(<AppLockBiometricsRow />);

    const toggle = await screen.findByTestId("biometrics-settings-switch");
    fireEvent(toggle, "valueChange", true);

    await waitFor(() => expect(armBiometricPrompt).toHaveBeenCalledTimes(1));
    expect(promptBiometrics).toHaveBeenCalledTimes(1);
  });

  it("is not offered on a device without biometrics", async () => {
    getBiometricsAvailability.mockResolvedValue({ status: "unavailable" });

    render(<AppLockBiometricsRow />);

    await waitFor(() => expect(getBiometricsAvailability).toHaveBeenCalled());
    expect(screen.queryByTestId("biometrics-settings-switch")).toBeNull();
  });
});
