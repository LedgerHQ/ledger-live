import { from } from "rxjs";
import { UnexpectedBootloader } from "@ledgerhq/errors";
import { aTransportBuilder } from "@ledgerhq/hw-transport-mocker";
import { listApps } from "./v2";
import ManagerAPI from "../../manager/api";
import { aDeviceInfoBuilder } from "../../mock/fixtures/aDeviceInfo";
import { ManagerApiRepository } from "../../device-core/managerApi/repositories/ManagerApiRepository";
import { StubManagerApiRepository } from "../../device-core/managerApi/repositories/StubManagerApiRepository";

jest.useFakeTimers();

describe("listApps v2", () => {
  let mockedManagerApiRepository: ManagerApiRepository;

  beforeEach(() => {
    jest
      .spyOn(
        jest.requireActual("../../device/use-cases/getLatestFirmwareForDeviceUseCase"),
        "getLatestFirmwareForDeviceUseCase",
      )
      .mockReturnValue(Promise.resolve(null));

    mockedManagerApiRepository = new StubManagerApiRepository();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it("should return an observable that errors if deviceInfo.isOSU is true", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({ isOSU: true, isBootloader: false });

    listApps({
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
        fail("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if deviceInfo.isBootloader is true", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, isBootloader: true });

    listApps({
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
        fail("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if transport.deviceModel.id is undefined, identifyTargetId returns a falsy value and deviceProxyModel is undefined", done => {
    const transport = aTransportBuilder({ deviceModel: null });
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, isBootloader: false, targetId: 0 });

    listApps({
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
      forceProvider: 1,
    }).subscribe();
    jest.advanceTimersByTime(1);

    expect(listAppsCommandSpy).not.toHaveBeenCalled();
    expect(listInstalledAppsSpy).toHaveBeenCalled();
  });

  it("should return an observable that errors if getDeviceVersion() throws", done => {
    jest.spyOn(ManagerAPI, "listInstalledApps").mockReturnValue(from([]));
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
        fail("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if catalogForDevice() throws", done => {
    jest.spyOn(ManagerAPI, "listInstalledApps").mockReturnValue(from([]));
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
        fail("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if getLanguagePackagesForDevice() throws", done => {
    jest.spyOn(ManagerAPI, "listInstalledApps").mockReturnValue(from([]));
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
        fail("this observable should not complete");
      },
    });

    jest.advanceTimersByTime(1);
  });
});
