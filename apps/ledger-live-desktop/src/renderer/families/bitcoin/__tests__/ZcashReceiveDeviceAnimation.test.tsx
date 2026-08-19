import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { DeviceModelId } from "@ledgerhq/devices";
import ZcashReceiveDeviceAnimation from "../ZcashReceiveDeviceAnimation";
import type { StepProps } from "~/renderer/modals/Receive/Body";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

const mockDevice: Device = {
  deviceId: "mock-device-id",
  modelId: DeviceModelId.nanoS,
  wired: true,
};

const SHIELDED = "u1testshieldedaddress";

const makeAccount = (currencyId: string, privateInfo?: object) => ({
  ...createFixtureAccount(),
  currency: { id: currencyId, family: "bitcoin" },
  ...(privateInfo !== undefined ? { privateInfo } : {}),
});

const renderAnimation = (
  overrides: Partial<StepProps> = {},
  flagEnabled = true,
  account = makeAccount("zcash", { shieldedAddress: SHIELDED, ufvk: "uview1test" }),
) =>
  render(
    <ZcashReceiveDeviceAnimation
      {...({
        account,
        parentAccount: null,
        device: mockDevice,
        ...overrides,
      } as StepProps)}
      fallback={<div data-testid="standard-device-animation" />}
    />,
    { initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }) },
  );

describe("ZcashReceiveDeviceAnimation", () => {
  it("shows the combined-address animation for a Zcash account with a shielded address", () => {
    renderAnimation();
    expect(screen.getByTestId("zcash-receive-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("standard-device-animation")).not.toBeInTheDocument();
  });

  it("falls back to the standard animation when the account has no shielded address", () => {
    renderAnimation({}, true, makeAccount("zcash", { ufvk: "uview1test" }));
    expect(screen.getByTestId("standard-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("zcash-receive-device-animation")).not.toBeInTheDocument();
  });

  it("falls back to the standard animation when the feature flag is disabled", () => {
    renderAnimation({}, false);
    expect(screen.getByTestId("standard-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("zcash-receive-device-animation")).not.toBeInTheDocument();
  });

  it("falls back to the standard animation for non-Zcash accounts", () => {
    renderAnimation({}, true, makeAccount("bitcoin"));
    expect(screen.getByTestId("standard-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("zcash-receive-device-animation")).not.toBeInTheDocument();
  });

  it("falls back to the standard animation when no device is connected", () => {
    renderAnimation({ device: null });
    expect(screen.getByTestId("standard-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("zcash-receive-device-animation")).not.toBeInTheDocument();
  });
});
