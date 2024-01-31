import { UnexpectedBootloader } from "@ledgerhq/errors";
import { aTransportBuilder } from "@ledgerhq/hw-transport-mocker";
import { listApps } from "./v2";
import { aDeviceInfoBuilder } from "../../mock/fixtures/aDeviceInfo";
import ManagerAPI from "../../manager/api";
import { from } from "rxjs";
import { aDeviceVersionBuilder } from "../../mock/fixtures/aDeviceVersion";

jest.useFakeTimers();

describe("listApps v2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an observable that errors if deviceInfo.isOSU is true", done => {
    const transport = aTransportBuilder();
    const deviceInfo = aDeviceInfoBuilder({ isOSU: true, isBootloader: false });
    const result = listApps({ transport, deviceInfo });

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
    const result = listApps({ transport, deviceInfo });

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

    const result = listApps({ transport, deviceInfo });

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

  it("should call hwListApps() if deviceInfo.managerAllowed is true", () => {
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

    listApps({ transport, deviceInfo }).subscribe({});
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

    listApps({ transport, deviceInfo }).subscribe();
    jest.advanceTimersByTime(1);

    expect(listAppsCommandSpy).not.toHaveBeenCalled();
    expect(listInstalledAppsSpy).toHaveBeenCalled();
  });

  it("should return an observable that errors if ManagerAPI.getDeviceVersion() throws", () => {
    jest.spyOn(ManagerAPI, "listInstalledApps").mockReturnValue(from([]));
    jest.spyOn(ManagerAPI, "getDeviceVersion").mockImplementation(() => {
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

    listApps({ transport, deviceInfo }).subscribe({
      error: err => {
        expect(err.message).toBe("getDeviceVersion failed");
      },
      complete: () => {
        fail("this observable should not complete");
      },
    });
    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if ManagerAPI.catalogForDevice() throws", () => {
    jest.spyOn(ManagerAPI, "listInstalledApps").mockReturnValue(from([]));
    jest
      .spyOn(ManagerAPI, "getDeviceVersion")
      .mockReturnValue(Promise.resolve(aDeviceVersionBuilder()));
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

    listApps({ transport, deviceInfo }).subscribe({
      error: err => {
        expect(err.message).toBe("catalogForDevice failed");
      },
      complete: () => {
        fail("this observable should not complete");
      },
    });
    jest.advanceTimersByTime(1);
  });

  it("should return an observable that errors if ManagerAPI.getLanguagePackagesForDevice() throws", () => {
    jest.spyOn(ManagerAPI, "listInstalledApps").mockReturnValue(from([]));
    jest
      .spyOn(ManagerAPI, "getDeviceVersion")
      .mockReturnValue(Promise.resolve(aDeviceVersionBuilder()));
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

    listApps({ transport, deviceInfo }).subscribe({
      error: err => {
        expect(err.message).toBe("getLanguagePackagesForDevice failed");
      },
      complete: () => {
        fail("this observable should not complete");
      },
    });
    jest.advanceTimersByTime(1);
  });
});
