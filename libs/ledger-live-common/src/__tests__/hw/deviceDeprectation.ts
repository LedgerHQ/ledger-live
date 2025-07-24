import { DeviceManagementKit, DeviceSessionId } from "@ledgerhq/device-management-kit";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { DeviceDeprecationError } from "../../errors";
import { throwErrorWhenDeviceDeprecated } from "../../hw/deviceDeprecation";

jest.mock("@ledgerhq/device-management-kit");
jest.mock("@ledgerhq/live-config/LiveConfig");

describe("throwErrorWhenDeviceDeprecated", () => {
  const mockDeviceManagementKit = {
    getConnectedDevice: jest.fn(),
  } as unknown as DeviceManagementKit;

  const mockSessionId: DeviceSessionId = "mockSessionId";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not throw an error if passDeprecation is true", () => {
    expect(() =>
      throwErrorWhenDeviceDeprecated(mockDeviceManagementKit, mockSessionId, true, "Polkadot"),
    ).not.toThrow();
  });

  it("should not throw an error if no deprecation config is found", () => {
    jest.spyOn(LiveConfig, "getValueByKey").mockReturnValue(undefined);

    expect(() =>
      throwErrorWhenDeviceDeprecated(mockDeviceManagementKit, mockSessionId, false, "Polkadot"),
    ).not.toThrow();
  });

  it("should throw a DeviceDeprecationError for errorScreen if the date has passed", () => {
    const mockConfig = {
      deviceDeprecated: [
        {
          deviceModelId: "nanoS",
          errorScreen: { date: "2023-01-01" },
        },
      ],
    };
    jest.spyOn(LiveConfig, "getValueByKey").mockReturnValue(mockConfig);
    (mockDeviceManagementKit.getConnectedDevice as jest.Mock).mockReturnValue({
      modelId: "nanoS",
    });

    expect(() =>
      throwErrorWhenDeviceDeprecated(mockDeviceManagementKit, mockSessionId, false, "Polkadot"),
    ).toThrow(DeviceDeprecationError);
  });

  it("should throw a DeviceDeprecationError for warningClearSigningScreen if the date has passed", () => {
    const mockConfig = {
      deviceDeprecated: [
        {
          deviceModelId: "nanoS",
          warningClearSigningScreen: {
            date: "2023-01-01",
            tokenExceptions: ["WINK"],
            deprecatedFlowExceptions: ["send"],
          },
        },
      ],
    };
    jest.spyOn(LiveConfig, "getValueByKey").mockReturnValue(mockConfig);
    (mockDeviceManagementKit.getConnectedDevice as jest.Mock).mockReturnValue({
      modelId: "nanoS",
    });

    expect(() =>
      throwErrorWhenDeviceDeprecated(mockDeviceManagementKit, mockSessionId, false, "Polkadot"),
    ).toThrow(DeviceDeprecationError);
  });

  it("should throw a DeviceDeprecationError for infoScreen if the date has passed", () => {
    const mockConfig = {
      deviceDeprecated: [
        {
          deviceModelId: "nanoS",
          infoScreen: { date: "2023-01-01" },
        },
      ],
    };
    jest.spyOn(LiveConfig, "getValueByKey").mockReturnValue(mockConfig);
    (mockDeviceManagementKit.getConnectedDevice as jest.Mock).mockReturnValue({
      modelId: "nanoS",
    });

    expect(() =>
      throwErrorWhenDeviceDeprecated(mockDeviceManagementKit, mockSessionId, false, "Polkadot"),
    ).toThrow(DeviceDeprecationError);
  });

  it("should not throw an error if the device model ID does not match", () => {
    const mockConfig = {
      deviceDeprecated: [
        {
          deviceModelId: "flex",
          errorScreen: { date: "2023-01-01" },
        },
      ],
    };
    jest.spyOn(LiveConfig, "getValueByKey").mockReturnValue(mockConfig);
    (mockDeviceManagementKit.getConnectedDevice as jest.Mock).mockReturnValue({
      modelId: "nanoS",
    });

    expect(() =>
      throwErrorWhenDeviceDeprecated(mockDeviceManagementKit, mockSessionId, false, "Polkadot"),
    ).not.toThrow();
  });

  it("should handle dependencies for the Exchange app", () => {
    const mockConfig = {
      deviceDeprecated: [
        {
          deviceModelId: "nanoS",
          errorScreen: { date: "2023-01-01" },
        },
      ],
    };
    jest.spyOn(LiveConfig, "getValueByKey").mockReturnValue(mockConfig);
    (mockDeviceManagementKit.getConnectedDevice as jest.Mock).mockReturnValue({
      modelId: "nanoS",
    });

    expect(() =>
      throwErrorWhenDeviceDeprecated(mockDeviceManagementKit, mockSessionId, false, "Exchange", [
        "polkadot",
      ]),
    ).toThrow(DeviceDeprecationError);
  });
});
