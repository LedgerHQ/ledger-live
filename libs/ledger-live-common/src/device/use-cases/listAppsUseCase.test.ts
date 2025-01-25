import { listAppsUseCase } from "./listAppsUseCase";
import Transport from "@ledgerhq/hw-transport";
import { DeviceInfo } from "@ledgerhq/types-live";
import { HttpManagerApiRepository } from "./screenSpecs";

const listAppsModule = jest.requireActual("../../apps/listApps");

jest.mock("@ledgerhq/live-env", () => {
  const actual = jest.requireActual("@ledgerhq/live-env");
  const { getEnv } = actual;
  return {
    ...actual,
    getEnv: jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case "DEVICE_PROXY_MODEL":
          return "mockDeviceProxyModel";
        case "FORCE_PROVIDER":
          return 123;
        case "MANAGER_DEV_MODE":
          return false;
        default:
          return getEnv(key);
      }
    }),
  };
});

describe("listAppsUseCase", () => {
  let listAppsSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks();
    listAppsSpy = jest.spyOn(listAppsModule, "listApps").mockImplementation(jest.fn());
  });

  it("should call listApps with the correct parameters", () => {
    listAppsUseCase({} as Transport, {} as DeviceInfo);

    expect(listAppsSpy).toHaveBeenCalledWith({
      transport: {},
      deviceInfo: {},
      deviceProxyModel: "mockDeviceProxyModel",
      managerApiRepository: expect.any(HttpManagerApiRepository),
      forceProvider: 123,
      managerDevModeEnabled: false,
    });
  });
});
