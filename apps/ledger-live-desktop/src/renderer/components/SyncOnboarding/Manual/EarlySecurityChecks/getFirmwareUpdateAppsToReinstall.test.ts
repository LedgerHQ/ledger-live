import { getFirmwareUpdateAppsToReinstall } from "./getFirmwareUpdateAppsToReinstall";
import manager from "@ledgerhq/live-common/manager/index";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";

jest.mock("@ledgerhq/live-common/manager/index", () => ({
  __esModule: true,
  default: {
    firmwareUpdateWillUninstallApps: jest.fn(),
  },
}));

const mockedManager = jest.mocked(manager);

const deviceInfo = { version: "1.0.0" } as DeviceInfo;

describe("getFirmwareUpdateAppsToReinstall", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns false when no apps are installed", () => {
    expect(getFirmwareUpdateAppsToReinstall([], deviceInfo, DeviceModelId.europa)).toBe(false);
    expect(mockedManager.firmwareUpdateWillUninstallApps).not.toHaveBeenCalled();
  });

  it("returns manager uninstall prediction when apps are installed", () => {
    mockedManager.firmwareUpdateWillUninstallApps.mockReturnValue(true);

    expect(
      getFirmwareUpdateAppsToReinstall(
        [
          {
            name: "Bitcoin",
            version: "1.0.0",
            hash: "",
            updated: false,
            blocks: 0,
            availableVersion: "1.0.0",
          },
        ],
        deviceInfo,
        DeviceModelId.europa,
      ),
    ).toBe(true);

    expect(mockedManager.firmwareUpdateWillUninstallApps).toHaveBeenCalledWith(
      deviceInfo,
      DeviceModelId.europa,
    );
  });
});
