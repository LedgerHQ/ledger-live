import React from "react";
import type { ComponentProps } from "react";
import { render, screen } from "tests/testSetup";
import FirmwareUpdate, { initialStepId } from "../index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";

const createDevice = (overrides?: Partial<Device>): Device =>
  ({
    deviceId: "test-device-id",
    modelId: DeviceModelId.nanoX,
    ...overrides,
  }) as Device;

const createDeviceInfo = (overrides?: Partial<DeviceInfo>): DeviceInfo =>
  ({
    version: "1.0.0",
    isOSU: false,
    mcuVersion: "1.0",
    ...overrides,
  }) as DeviceInfo;

const firmwareWithVersion = (name = "2.2.0"): FirmwareUpdateContext =>
  ({
    osu: {},
    final: { name },
    shouldFlashMCU: false,
  }) as FirmwareUpdateContext;

const defaultSettings = {
  discreetMode: false,
  vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
  devicesModelList: [],
  anonymousUserNotifications: {},
  latestFirmware: null as FirmwareUpdateContext | null,
};

const getInitialState = (overrides: Record<string, unknown> = {}) => ({
  application: { hasPassword: false },
  accounts: [],
  devices: { currentDevice: null, devices: [] },
  ...overrides,
  settings: {
    ...defaultSettings,
    ...(overrides.settings as Record<string, unknown> | undefined),
  },
});

const defaultProps: ComponentProps<typeof FirmwareUpdate> = {
  device: createDevice(),
  deviceInfo: createDeviceInfo(),
  setPreventResetOnDeviceChange: jest.fn(),
  onReset: jest.fn(),
  firmware: firmwareWithVersion(),
  error: null,
  openFirmwareUpdate: false,
};

const renderFirmwareUpdate = (
  props: Partial<ComponentProps<typeof FirmwareUpdate>> = {},
  {
    latestFirmware = defaultProps.firmware,
    ...stateOverrides
  }: { latestFirmware?: FirmwareUpdateContext | null } & Record<string, unknown> = {},
) =>
  render(<FirmwareUpdate {...defaultProps} {...props} />, {
    initialRoute: "/manager",
    initialState: getInitialState({
      ...stateOverrides,
      settings: {
        latestFirmware,
        ...(stateOverrides.settings as Record<string, unknown> | undefined),
      },
    }),
  });

describe("initialStepId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns updateMCU when device is OSU", () => {
    const deviceInfo = createDeviceInfo({ isOSU: true });
    const device = createDevice();
    expect(initialStepId({ deviceInfo, device })).toBe("updateMCU");
  });

  it("returns resetDevice when firmware update needs legacy blue reset", () => {
    const deviceInfo = createDeviceInfo({ version: "1.3.3" });
    const device = createDevice({ modelId: DeviceModelId.blue });
    expect(initialStepId({ deviceInfo, device })).toBe("resetDevice");
  });

  it("returns idCheck when device is not OSU and no legacy reset", () => {
    const deviceInfo = createDeviceInfo({ version: "1.3.0" });
    const device = createDevice();
    expect(initialStepId({ deviceInfo, device })).toBe("idCheck");
  });
});

describe("FirmwareUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when firmware is null and device is not deprecated", () => {
    const { container } = render(<FirmwareUpdate {...defaultProps} firmware={null} error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders deprecated banner with contact support when firmware is null and device is deprecated", () => {
    renderFirmwareUpdate(
      {
        device: createDevice({ modelId: DeviceModelId.nanoS }),
        deviceInfo: createDeviceInfo({ version: "1.1.0" }),
        firmware: null,
        error: null,
      },
      { latestFirmware: firmwareWithVersion() },
    );

    expect(screen.getByRole("button", { name: /contact support/i })).toBeVisible();
  });

  it("renders update firmware button when firmware is available", () => {
    renderFirmwareUpdate();
    expect(screen.getByTestId("manager-update-firmware-button")).toBeVisible();
  });

  it("renders update section when firmware update requires user to uninstall apps", () => {
    renderFirmwareUpdate({
      device: createDevice({ modelId: DeviceModelId.nanoS }),
      deviceInfo: createDeviceInfo({ version: "1.4.2" }),
    });
    expect(screen.getByTestId("manager-update-firmware-button")).toBeVisible();
    expect(screen.getByText("Uninstall all apps before updating")).toBeVisible();
  });

  it("disables update button when disableFirmwareUpdate is true", () => {
    renderFirmwareUpdate({ disableFirmwareUpdate: true });
    expect(screen.getByTestId("manager-update-firmware-button")).toBeDisabled();
  });

  it("update button is clickable when firmware is available", async () => {
    const { user } = renderFirmwareUpdate();
    const button = screen.getByTestId("manager-update-firmware-button");
    await user.click(button);
    expect(button).toBeVisible();
  });
});
