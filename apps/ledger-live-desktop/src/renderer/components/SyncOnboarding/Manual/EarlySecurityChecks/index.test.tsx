import React from "react";
import { render } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useGenuineCheck, type GenuineState } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware";
import EarlySecurityChecks from ".";
import Body from "./Body";
import { Status as SoftwareCheckStatus } from "../types";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

jest.mock("~/renderer/hooks/useNetworkStatus", () => ({
  ...jest.requireActual("~/renderer/hooks/useNetworkStatus"),
  useNetworkStatus: () => ({ networkStatus: "online" }),
}));

jest.mock("~/renderer/hooks/useTheme", () => ({
  __esModule: true,
  default: () => ({ theme: "light" }),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: () => "https://example.test",
}));

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  useConnectManagerAction: () => ({
    useHook: () => ({
      result: undefined,
      isLoading: false,
      error: undefined,
      allowManagerRequested: false,
      allowManagerGranted: false,
    }),
  }),
}));

jest.mock("@ledgerhq/live-common/hw/hooks/useGenuineCheck", () => ({
  useGenuineCheck: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware", () => ({
  useGetLatestAvailableFirmware: jest.fn(),
}));

jest.mock("./Body", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const mockedUseGenuineCheck = jest.mocked(useGenuineCheck);
const mockedUseGetLatestAvailableFirmware = jest.mocked(useGetLatestAvailableFirmware);
const mockedBody = jest.mocked(Body);

const deviceA: Device = {
  deviceId: "device-a",
  deviceName: "Device A",
  modelId: DeviceModelId.nanoX,
  wired: true,
};

const deviceB: Device = {
  deviceId: "device-b",
  deviceName: "Device B",
  modelId: DeviceModelId.nanoX,
  wired: true,
};

const noAvailableFirmwareState = {
  firmwareUpdateContext: null,
  deviceInfo: null,
  status: "no-available-firmware" as const,
  lockedDevice: false,
  error: null,
};

const baseProps = {
  onComplete: jest.fn(),
  restartChecksAfterUpdate: jest.fn(),
  isInitialRunOfSecurityChecks: true,
  fwUpdateInterrupted: null,
  setFwUpdateInterrupted: jest.fn(),
  isDeviceConnected: true,
  onFirmwareUpdateClose: jest.fn(),
};

/** Mimics the real useGenuineCheck hook: genuineState is sticky across
 * `isHookEnabled` toggles and only clears when resetGenuineCheckState is called. */
function mockGenuineCheck(initialGenuineState: GenuineState) {
  let genuineState = initialGenuineState;
  const resetGenuineCheckState = jest.fn(() => {
    genuineState = "unchecked";
  });
  mockedUseGenuineCheck.mockImplementation(() => ({
    genuineState,
    devicePermissionState: "unrequested",
    error: null,
    resetGenuineCheckState,
  }));
  return { resetGenuineCheckState };
}

function lastBodyProps() {
  const calls = mockedBody.mock.calls;
  return calls[calls.length - 1][0];
}

describe("EarlySecurityChecks", () => {
  beforeEach(() => {
    mockedUseGetLatestAvailableFirmware.mockReturnValue({ state: noAvailableFirmwareState });
  });

  it("resets the genuine and firmware check status when the device identity changes mid-flow", () => {
    const { resetGenuineCheckState } = mockGenuineCheck("genuine");

    const { rerender } = render(<EarlySecurityChecks device={deviceA} {...baseProps} />);

    expect(lastBodyProps().genuineCheckStatus).toBe(SoftwareCheckStatus.completed);

    rerender(<EarlySecurityChecks device={deviceB} {...baseProps} />);

    expect(resetGenuineCheckState).toHaveBeenCalled();
    expect(lastBodyProps().genuineCheckStatus).toBe(SoftwareCheckStatus.inactive);
    expect(lastBodyProps().firmwareUpdateStatus).toBe(SoftwareCheckStatus.inactive);
  });

  it("does not reset when re-rendered with the same device identity", () => {
    const { resetGenuineCheckState } = mockGenuineCheck("genuine");

    const { rerender } = render(<EarlySecurityChecks device={deviceA} {...baseProps} />);
    expect(lastBodyProps().genuineCheckStatus).toBe(SoftwareCheckStatus.completed);

    rerender(<EarlySecurityChecks device={{ ...deviceA }} {...baseProps} />);

    expect(resetGenuineCheckState).not.toHaveBeenCalled();
    expect(lastBodyProps().genuineCheckStatus).toBe(SoftwareCheckStatus.completed);
  });
});
