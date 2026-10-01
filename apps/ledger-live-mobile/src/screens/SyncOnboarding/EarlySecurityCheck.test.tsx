import React from "react";
import { render } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useGenuineCheck, type GenuineState } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware";
import { EarlySecurityCheck } from "./EarlySecurityCheck";
import EarlySecurityCheckBody from "./EarlySecurityCheckBody";
import type { EarlySecurityCheckProps } from "./EarlySecurityCheck";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: () => ({ enabled: false, params: undefined }),
}));

jest.mock("@ledgerhq/live-common/hw/hooks/useGenuineCheck", () => ({
  useGenuineCheck: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware", () => ({
  useGetLatestAvailableFirmware: jest.fn(),
}));

jest.mock("./EarlySecurityCheckBody", () => jest.fn(() => null));

jest.mock("./LanguagePrompt", () => ({
  LanguagePrompt: () => null,
}));

const mockedUseGenuineCheck = jest.mocked(useGenuineCheck);
const mockedUseGetLatestAvailableFirmware = jest.mocked(useGetLatestAvailableFirmware);
const mockedBody = jest.mocked(EarlySecurityCheckBody);

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

const baseProps: Omit<EarlySecurityCheckProps, "device"> = {
  navigation: {
    goBack: jest.fn(),
    push: jest.fn(),
  } as unknown as EarlySecurityCheckProps["navigation"],
  route: {} as EarlySecurityCheckProps["route"],
  notifyOnboardingEarlyCheckEnded: jest.fn(),
  notifyEarlySecurityCheckShouldReset: jest.fn(),
  onCancelOnboarding: jest.fn(),
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

describe("EarlySecurityCheck", () => {
  beforeEach(() => {
    mockedUseGetLatestAvailableFirmware.mockReturnValue({ state: noAvailableFirmwareState });
  });

  it("resets the genuine and firmware check status when the device identity changes mid-flow", () => {
    const { resetGenuineCheckState } = mockGenuineCheck("genuine");

    const { rerender } = render(
      <EarlySecurityCheck device={deviceA} isAlreadyGenuine {...baseProps} />,
    );

    expect(lastBodyProps().genuineCheckUiStepStatus).toBe("completed");

    rerender(<EarlySecurityCheck device={deviceB} isAlreadyGenuine {...baseProps} />);

    expect(resetGenuineCheckState).toHaveBeenCalled();
    expect(lastBodyProps().genuineCheckUiStepStatus).toBe("inactive");
    expect(lastBodyProps().firmwareUpdateUiStepStatus).toBe("inactive");
  });

  it("does not reset when re-rendered with the same device identity", () => {
    const { resetGenuineCheckState } = mockGenuineCheck("genuine");

    const { rerender } = render(
      <EarlySecurityCheck device={deviceA} isAlreadyGenuine {...baseProps} />,
    );
    expect(lastBodyProps().genuineCheckUiStepStatus).toBe("completed");

    rerender(<EarlySecurityCheck device={{ ...deviceA }} isAlreadyGenuine {...baseProps} />);

    expect(resetGenuineCheckState).not.toHaveBeenCalled();
    expect(lastBodyProps().genuineCheckUiStepStatus).toBe("completed");
  });
});
