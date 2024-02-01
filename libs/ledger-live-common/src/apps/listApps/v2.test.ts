import { aTransportBuilder } from "@ledgerhq/hw-transport-mocker";
import { listApps } from "./v2";
import { aDeviceInfoBuilder } from "../../mock/fixtures/aDeviceInfo";
import ManagerAPI from "../../manager/api";
import { aDeviceVersionBuilder } from "../../mock/fixtures/aDeviceVersion";
import { ManagerApiRepository } from "../../device-core/managerApi/repositories/ManagerApiRepository";
import { StubManagerApiRepository } from "../../device-core/managerApi/repositories/StubManagerApiRepository";
import { from } from "rxjs";
import { UnexpectedBootloader } from "@ledgerhq/errors";

jest.useFakeTimers();

describe("listApps v2", () => {
  let mockedGetDeviceVersion;
  let mockedManagerApiRepository: ManagerApiRepository;

  beforeEach(() => {
    jest
      .spyOn(
        jest.requireActual("../../device/use-cases/getLatestFirmwareForDeviceUseCase"),
        "getLatestFirmwareForDeviceUseCase",
      )
      .mockReturnValue(Promise.resolve(null));
    mockedGetDeviceVersion = jest.fn().mockReturnValue(Promise.resolve(aDeviceVersionBuilder()));
    mockedManagerApiRepository = {
      ...new StubManagerApiRepository(),
      getDeviceVersion: mockedGetDeviceVersion,
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it("should return an observable that errors if deviceInfo.isOSU is true", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({ isOSU: true, isBootloader: false });
    const result = listApps({
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
    });

    result.subscribe({
      error: err => {
        expect(err).toBeInstanceOf(UnexpectedBootloader);
        done();
      },
      complete: () => {
        fail("this observable should not complete");
      },
    });
    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if deviceInfo.isBootloader is true", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, isBootloader: true });
    const result = listApps({
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
    });

    result.subscribe({
      error: err => {
        expect(err).toBeInstanceOf(UnexpectedBootloader);
        done();
      },
      complete: () => {
        fail("this observable should not complete");
      },
    });
    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if transport.deviceModel.id is undefined, identifyTargetId returns a falsy value and deviceProxyModel is undefined", done => {
    const transport = aTransportBuilder({ deviceModel: null });
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, isBootloader: false, targetId: 0 });

    const result = listApps({
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
    });

    result.subscribe({
      error: err => {
        expect(err.message).toBe("Bad usage of listAppsV2: missing deviceModelId");
        done();
      },
      complete: () => {
        fail("this observable should not complete");
      },
    });
    jest.advanceTimersByTime(1);
  });

  it("should call hwListApps() if deviceInfo.managerAllowed is true", done => {
    const listAppsCommandSpy = jest
      .spyOn(jest.requireActual("../../hw/listApps"), "default")
      .mockReturnValue(Promise.resolve([]));
    const listInstalledAppsSpy = jest.spyOn(ManagerAPI, "listInstalledApps");
    mockedGetDeviceVersion.mockReturnValue(Promise.resolve(aDeviceVersionBuilder()));
    jest.spyOn(ManagerAPI, "catalogForDevice").mockReturnValue(Promise.resolve([]));
    jest.spyOn(ManagerAPI, "getLanguagePackagesForDevice").mockReturnValue(Promise.resolve([]));

    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: true,
      targetId: 0x33200000,
    });

    listApps({
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
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
    const listAppsCommandSpy = jest.spyOn(jest.requireActual("../../hw/listApps"), "default");
    const listInstalledAppsSpy = jest
      .spyOn(ManagerAPI, "listInstalledApps")
      .mockReturnValue(from([]));

    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      targetId: 0x33200000,
    });

    listApps({
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
    }).subscribe();
    jest.advanceTimersByTime(1);

    expect(listAppsCommandSpy).not.toHaveBeenCalled();
    expect(listInstalledAppsSpy).toHaveBeenCalled();
  });

  it("should return an observable that errors if getDeviceVersion() throws", done => {
    jest.spyOn(ManagerAPI, "listInstalledApps").mockReturnValue(from([]));
    mockedGetDeviceVersion.mockImplementation(() => {
      throw new Error("getDeviceVersion failed");
    });
    jest.spyOn(ManagerAPI, "catalogForDevice").mockReturnValue(Promise.resolve([]));
    jest.spyOn(ManagerAPI, "getLanguagePackagesForDevice").mockReturnValue(Promise.resolve([]));

    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      targetId: 0x33200000,
    });

    listApps({
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
    }).subscribe({
      error: err => {
        expect(err.message).toBe("getDeviceVersion failed");
        done();
      },
      complete: () => {
        fail("this observable should not complete");
      },
    });
    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if ManagerAPI.catalogForDevice() throws", done => {
    jest.spyOn(ManagerAPI, "listInstalledApps").mockReturnValue(from([]));
    jest.spyOn(ManagerAPI, "catalogForDevice").mockImplementation(() => {
      throw new Error("catalogForDevice failed");
    });
    jest.spyOn(ManagerAPI, "getLanguagePackagesForDevice").mockReturnValue(Promise.resolve([]));

    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      targetId: 0x33200000,
    });

    listApps({
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
    }).subscribe({
      error: err => {
        expect(err.message).toBe("catalogForDevice failed");
        done();
      },
      complete: () => {
        fail("this observable should not complete");
      },
    });
    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if ManagerAPI.getLanguagePackagesForDevice() throws", done => {
    jest.spyOn(ManagerAPI, "listInstalledApps").mockReturnValue(from([]));
    jest.spyOn(ManagerAPI, "catalogForDevice").mockReturnValue(Promise.resolve([]));
    jest.spyOn(ManagerAPI, "getLanguagePackagesForDevice").mockImplementation(() => {
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
      transport,
      deviceInfo,
      managerApiRepository: mockedManagerApiRepository,
    }).subscribe({
      error: err => {
        expect(err.message).toBe("getLanguagePackagesForDevice failed");
        done();
      },
      complete: () => {
        fail("this observable should not complete");
      },
    });
    jest.advanceTimersByTime(1);
  });
});
