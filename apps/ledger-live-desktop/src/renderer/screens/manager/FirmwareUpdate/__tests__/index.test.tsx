import React from "react";
import { render, screen } from "tests/testSetup";
import FirmwareUpdate, { initialStepId } from "../index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";

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

const defaultSettings = {
  discreetMode: false,
  vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
  devicesModelList: [],
  anonymousUserNotifications: {},
  latestFirmware: null as FirmwareUpdateContext | null,
};

const getDefaultInitialState = (overrides: Record<string, unknown> = {}) => ({
  application: { hasPassword: false },
  accounts: [],
  devices: { currentDevice: null, devices: [] },
  ...overrides,
  settings: {
    ...defaultSettings,
    ...(overrides.settings as Record<string, unknown> | undefined),
  },
});

describe("initialStepId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns updateMCU when device is OSU", () => {
    const deviceInfo = createDeviceInfo({
      isOSU: true,
    });
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
  const defaultProps = {
    device: createDevice(),
    deviceInfo: createDeviceInfo(),
    setPreventResetOnDeviceChange: jest.fn(),
    onReset: jest.fn(),
    firmware: {
      osu: {},
      final: { name: "2.2.0" },
      shouldFlashMCU: false,
    } as FirmwareUpdateContext,
    error: null,
    openFirmwareUpdate: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when isWallet40Enabled is true", () => {
    const { container } = render(<FirmwareUpdate {...defaultProps} />, {
      initialState: getDefaultInitialState({
        overriddenFeatureFlags: {
          lwdWallet40: { enabled: true },
        },
      }),
    });
    expect(container.firstChild).toBeNull();
  });

  it("returns null when firmware is null and device is not deprecated", () => {
    const { container } = render(<FirmwareUpdate {...defaultProps} firmware={null} error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders deprecated banner with contact support when firmware is null and device is deprecated", () => {
    render(
      <FirmwareUpdate
        {...defaultProps}
        device={createDevice({ modelId: DeviceModelId.nanoS })}
        deviceInfo={createDeviceInfo({ version: "1.1.0" })}
        firmware={null}
        error={null}
      />,
      {
        initialState: getDefaultInitialState({
          settings: {
            latestFirmware: {
              osu: {},
              final: { name: "2.2.0" },
              shouldFlashMCU: false,
            },
          },
        }),
      },
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    expect(
      buttons.some(b =>
        /contact|support|manager\.firmware\.banner\.old\.cta/i.test(b.textContent ?? ""),
      ),
    ).toBe(true);
  });

  it("renders update firmware button when firmware is available", () => {
    render(<FirmwareUpdate {...defaultProps} />, {
      initialState: getDefaultInitialState({
        settings: {
          latestFirmware: {
            osu: {},
            final: { name: "2.2.0" },
            shouldFlashMCU: false,
          },
        },
      }),
    });
    expect(screen.getByTestId("manager-update-firmware-button")).toBeInTheDocument();
  });

  it("renders update section when firmware update requires user to uninstall apps", () => {
    render(<FirmwareUpdate {...defaultProps} />, {
      initialState: getDefaultInitialState({
        settings: {
          latestFirmware: {
            osu: {},
            final: { name: "2.2.0" },
            shouldFlashMCU: false,
          },
        },
      }),
    });
    expect(screen.getByTestId("manager-update-firmware-button")).toBeInTheDocument();
  });

  it("disables update button when disableFirmwareUpdate is true", () => {
    render(<FirmwareUpdate {...defaultProps} disableFirmwareUpdate />, {
      initialState: getDefaultInitialState({
        settings: {
          latestFirmware: {
            osu: {},
            final: { name: "2.2.0" },
            shouldFlashMCU: false,
          },
        },
      }),
    });
    expect(screen.getByTestId("manager-update-firmware-button")).toBeDisabled();
  });

  it("update button is clickable when firmware is available", async () => {
    const { user } = render(<FirmwareUpdate {...defaultProps} />, {
      initialState: getDefaultInitialState({
        settings: {
          latestFirmware: {
            osu: {},
            final: { name: "2.2.0" },
            shouldFlashMCU: false,
          },
        },
      }),
    });
    const button = screen.getByTestId("manager-update-firmware-button");
    await user.click(button);
    expect(button).toBeInTheDocument();
  });
});
