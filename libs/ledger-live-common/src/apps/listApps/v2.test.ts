import { from } from "rxjs";
import { UnexpectedBootloader } from "@ledgerhq/errors";
import { aTransportBuilder } from "@ledgerhq/hw-transport-mocker";
import { listApps } from "./v2";
import ManagerAPI from "../../manager/api";
import { aDeviceInfoBuilder } from "../../mock/fixtures/aDeviceInfo";
import {
  ManagerApiRepository,
  StubManagerApiRepository,
} from "../../device/factories/HttpManagerApiRepositoryFactory";
import { supportedDeviceModelIds as clsSupportedDeviceModelIds } from "../../device/use-cases/isCustomLockScreenSupported";
import { DeviceModel } from "@ledgerhq/devices";
import customLockScreenFetchSize from "../../hw/customLockScreenFetchSize";
import { getDeviceName } from "../../device/use-cases/getDeviceNameUseCase";
import { currenciesByMarketcap, listCryptoCurrencies } from "../../currencies";
import { makeAppV2Mock } from "../mock";

jest.useFakeTimers();
jest.mock("../../hw/customLockScreenFetchSize");
jest.mock("../../device/use-cases/getDeviceNameUseCase");
jest.mock("../../currencies");

const mockedCustomLockScreenFetchSize = jest.mocked(customLockScreenFetchSize);
const mockedGetDeviceName = jest.mocked(getDeviceName);
const mockedListCryptoCurrencies = jest.mocked(listCryptoCurrencies);
const mockedCurrenciesByMarketCap = jest.mocked(currenciesByMarketcap);

describe("listApps v2", () => {
  let mockedManagerApiRepository: ManagerApiRepository;
  let listAppsCommandSpy: jest.SpyInstance;
  let listInstalledAppsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest
      .spyOn(
        jest.requireActual("../../device/use-cases/getLatestFirmwareForDeviceUseCase"),
        "getLatestFirmwareForDeviceUseCase",
      )
      .mockReturnValue(Promise.resolve(null));
    mockedManagerApiRepository = new StubManagerApiRepository();
    mockedGetDeviceName.mockReturnValue(Promise.resolve("Mocked device name"));
    mockedCurrenciesByMarketCap.mockReturnValue(Promise.resolve([]));
    mockedListCryptoCurrencies.mockReturnValue([]);

    listAppsCommandSpy = jest
      .spyOn(jest.requireActual("../../hw/listApps"), "default")
      .mockReturnValue(Promise.resolve([]));

    listInstalledAppsSpy = jest.spyOn(ManagerAPI, "listInstalledApps").mockReturnValue(from([]));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  it("should return an observable that errors if deviceInfo.isOSU is true", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({ isOSU: true, isBootloader: false });

    listApps({
      managerDevModeEnabled: false,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe({
      error: err => {
        expect(err).toBeInstanceOf(UnexpectedBootloader);
        done();
      },
      complete: () => {
        done("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if deviceInfo.isBootloader is true", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, isBootloader: true });

    listApps({
      managerDevModeEnabled: false,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe({
      error: err => {
        expect(err).toBeInstanceOf(UnexpectedBootloader);
        done();
      },
      complete: () => {
        done("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if transport.deviceModel.id is undefined, identifyTargetId returns a falsy value and deviceProxyModel is undefined", done => {
    const transport = aTransportBuilder({ deviceModel: null });
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, isBootloader: false, targetId: 0 });

    listApps({
      managerDevModeEnabled: false,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe({
      error: err => {
        expect(err.message).toBe("Bad usage of listAppsV2: missing deviceModelId");
        done();
      },
      complete: () => {
        done("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should call hwListApps() if deviceInfo.managerAllowed is true", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: true,
      targetId: 0x33200000,
    });

    listApps({
      managerDevModeEnabled: false,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe({
      complete: () => {
        done();
      },
      error: () => {
        done();
      },
    });

    jest.advanceTimersByTime(1);

    expect(listAppsCommandSpy).toHaveBeenCalled();
    expect(listInstalledAppsSpy).not.toHaveBeenCalled();
  });

  it("should call ManagerAPI.listInstalledApps() if deviceInfo.managerAllowed is false", () => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      targetId: 0x33200000,
    });

    listApps({
      managerDevModeEnabled: false,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe();
    jest.advanceTimersByTime(1);

    expect(listAppsCommandSpy).not.toHaveBeenCalled();
    expect(listInstalledAppsSpy).toHaveBeenCalled();
  });

  it("should return an observable that errors if getDeviceVersion() throws", done => {
    jest.spyOn(mockedManagerApiRepository, "getDeviceVersion").mockImplementation(() => {
      throw new Error("getDeviceVersion failed");
    });

    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      targetId: 0x33200000,
    });

    listApps({
      managerDevModeEnabled: false,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe({
      error: err => {
        expect(err.message).toBe("getDeviceVersion failed");
        done();
      },
      complete: () => {
        done("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if catalogForDevice() throws", done => {
    jest.spyOn(mockedManagerApiRepository, "catalogForDevice").mockImplementation(() => {
      throw new Error("catalogForDevice failed");
    });

    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      targetId: 0x33200000,
    });

    listApps({
      managerDevModeEnabled: false,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe({
      error: err => {
        expect(err.message).toBe("catalogForDevice failed");
        done();
      },
      complete: () => {
        done("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if getLanguagePackagesForDevice() throws", done => {
    jest
      .spyOn(mockedManagerApiRepository, "getLanguagePackagesForDevice")
      .mockImplementation(() => {
        throw new Error("getLanguagePackagesForDevice failed");
      });

    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      targetId: 0x33200000,
    });

    listApps({
      managerDevModeEnabled: false,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe({
      error: err => {
        expect(err.message).toBe("getLanguagePackagesForDevice failed");
        done();
      },
      complete: () => {
        done("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });

  clsSupportedDeviceModelIds.forEach(deviceModelId => {
    it(`should return customImageBlocks different than 0 for a ${deviceModelId} device with a custom lock screen`, done => {
      const transport = aTransportBuilder({ deviceModel: { id: deviceModelId } as DeviceModel });
      const deviceInfo = aDeviceInfoBuilder({
        isOSU: false,
        isBootloader: false,
        managerAllowed: true,
        targetId: 0x33200000,
      });

      mockedCustomLockScreenFetchSize.mockReturnValue(Promise.resolve(10));

      let gotResult = false;

      listApps({
        managerDevModeEnabled: false,
        transport,
        deviceInfo,
        managerApiRepository: mockedManagerApiRepository,
        forceProvider: 1,
      }).subscribe({
        next: listAppsEvent => {
          if (listAppsEvent.type === "result") {
            gotResult = true;
            const {
              result: { customImageBlocks },
            } = listAppsEvent;
            try {
              expect(customImageBlocks).not.toBe(0);
            } catch (e) {
              done(e);
            }
          }
        },
        complete: () => {
          gotResult ? done() : done("this observable should not complete without a result");
        },
        error: error => {
          done(error);
        },
      });

      jest.advanceTimersByTime(1);
    });
  });

  it("should keep apps with isDevTools if managerDevModeEnabled is true", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: true,
      targetId: 0x33200000,
    });

    mockedManagerApiRepository = {
      ...new StubManagerApiRepository(),
      catalogForDevice: () =>
        Promise.resolve([
          makeAppV2Mock({ versionName: "Mocked dev app", isDevTools: true }),
          makeAppV2Mock({ versionName: "Another non dev app", isDevTools: false }),
        ]),
    };

    listApps({
      managerDevModeEnabled: true,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe({
      next: listAppsEvent => {
        if (listAppsEvent.type === "result") {
          const {
            result: { appsListNames },
          } = listAppsEvent;
          try {
            expect(appsListNames).toEqual(["Mocked dev app", "Another non dev app"]);
            done();
          } catch (e) {
            done(e);
          }
        }
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should not keep apps with isDevTools if managerDevModeEnabled is false", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: true,
      targetId: 0x33200000,
    });

    mockedManagerApiRepository = {
      ...new StubManagerApiRepository(),
      catalogForDevice: () =>
        Promise.resolve([
          makeAppV2Mock({ versionName: "Mocked dev app", isDevTools: true }),
          makeAppV2Mock({ versionName: "Another non dev app", isDevTools: false }),
        ]),
    };

    listApps({
      managerDevModeEnabled: false,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe({
      next: listAppsEvent => {
        if (listAppsEvent.type === "result") {
          const {
            result: { appsListNames },
          } = listAppsEvent;
          try {
            expect(appsListNames).toEqual(["Another non dev app"]);
            done();
          } catch (e) {
            done(e);
          }
        }
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should keep apps with isDevTools if managerDevModeEnabled is disabled but those apps are installed", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: true,
      targetId: 0x33200000,
    });

    mockedManagerApiRepository = {
      ...new StubManagerApiRepository(),
      catalogForDevice: () =>
        Promise.resolve([
          makeAppV2Mock({ versionName: "Mocked dev app", isDevTools: true }),
          makeAppV2Mock({ versionName: "Another non dev app", isDevTools: false }),
        ]),
      getAppsByHash(hashes) {
        const hashToApp = {
          hash1: makeAppV2Mock({ versionName: "Mocked dev app", isDevTools: true }),
          hash2: makeAppV2Mock({ versionName: "Another non dev app", isDevTools: false }),
        };
        return Promise.resolve(hashes.map(hash => hashToApp[hash]));
      },
    };

    listAppsCommandSpy.mockResolvedValue([
      { hash: "hash1", name: "Mocked dev app" },
      { hash: "hash2", name: "Another non dev app" },
    ]);

    listApps({
      managerDevModeEnabled: false,
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
      forceProvider: 1,
    }).subscribe({
      next: listAppsEvent => {
        if (listAppsEvent.type === "result") {
          const {
            result: { appsListNames },
          } = listAppsEvent;
          try {
            expect(appsListNames).toEqual(["Mocked dev app", "Another non dev app"]);
            done();
          } catch (e) {
            done(e);
          }
        }
      },
    });

    jest.advanceTimersByTime(1);
  });
});
