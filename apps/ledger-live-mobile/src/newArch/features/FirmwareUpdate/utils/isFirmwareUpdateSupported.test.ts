import ReactNative from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  isOldFirmwareUpdateUxSupported,
  isNewFirmwareUpdateUxSupported,
} from "./isFirmwareUpdateSupported";
import { DeviceModelInfo } from "@ledgerhq/types-live";

describe("isNewFirmwareUpdateUxSupported", () => {
  it("should return true if sync onboarding is supported", () => {
    expect(isNewFirmwareUpdateUxSupported(DeviceModelId.stax)).toBe(true);
    expect(isNewFirmwareUpdateUxSupported(DeviceModelId.europa)).toBe(true);
  });

  it("should return false if sync onboarding is not supported", () => {
    expect(isNewFirmwareUpdateUxSupported(DeviceModelId.nanoS)).toBe(false);
    expect(isNewFirmwareUpdateUxSupported(DeviceModelId.nanoSP)).toBe(false);
    expect(isNewFirmwareUpdateUxSupported(DeviceModelId.nanoX)).toBe(false);
    expect(isNewFirmwareUpdateUxSupported(DeviceModelId.blue)).toBe(false);
  });
});

describe("isOldFirmwareUpdateUxSupported", () => {
  let isFirmwareUpdateVersionSupportedSpy: jest.SpyInstance;
  let PlatformSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks();
    isFirmwareUpdateVersionSupportedSpy = jest.spyOn(
      jest.requireActual("@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported"),
      "default",
    );
    PlatformSpy = jest.spyOn(ReactNative, "Platform", "get");
  });

  it("should return { updateSupported:false, updateSupportedButDeviceNotWired: false } if lastSeenDeviceModelInfo is falsy", () => {
    const lastConnectedDevice = {} as Parameters<
      typeof isOldFirmwareUpdateUxSupported
    >[0]["lastConnectedDevice"];

    const lastSeenDeviceModelInfo = null;

    expect(
      isOldFirmwareUpdateUxSupported({
        lastSeenDeviceModelInfo,
        lastConnectedDevice,
      }),
    ).toEqual({
      updateSupported: false,
      updateSupportedButDeviceNotWired: false,
    });
  });

  it("should return { updateSupported:false, updateSupportedButDeviceNotWired: false } if isFirmwareUpdateVersionSupported returns false", () => {
    const lastConnectedDevice = {} as Parameters<
      typeof isOldFirmwareUpdateUxSupported
    >[0]["lastConnectedDevice"];
    const lastSeenDeviceModelInfo = {} as DeviceModelInfo;

    isFirmwareUpdateVersionSupportedSpy.mockReturnValue(false);

    expect(
      isOldFirmwareUpdateUxSupported({
        lastSeenDeviceModelInfo,
        lastConnectedDevice,
      }),
    ).toEqual({
      updateSupported: false,
      updateSupportedButDeviceNotWired: false,
    });
  });

  it("should return { updateSupported:false, updateSupportedButDeviceNotWired: false } if Platform.OS is not android", () => {
    isFirmwareUpdateVersionSupportedSpy.mockReturnValue(true);
    const lastConnectedDevice = {} as Parameters<
      typeof isOldFirmwareUpdateUxSupported
    >[0]["lastConnectedDevice"];
    const lastSeenDeviceModelInfo = {} as DeviceModelInfo;

    PlatformSpy.mockReturnValue({
      OS: "ios",
    } as typeof ReactNative.Platform);

    expect(
      isOldFirmwareUpdateUxSupported({
        lastSeenDeviceModelInfo,
        lastConnectedDevice,
      }),
    ).toEqual({
      updateSupported: false,
      updateSupportedButDeviceNotWired: false,
    });
  });

  it("should return { updateSupported:false, updateSupportedButDeviceNotWired: true } if device is not wired", () => {
    isFirmwareUpdateVersionSupportedSpy.mockReturnValue(true);
    const lastConnectedDevice = {
      wired: false,
    } as Parameters<typeof isOldFirmwareUpdateUxSupported>[0]["lastConnectedDevice"];
    const lastSeenDeviceModelInfo = {} as DeviceModelInfo;

    PlatformSpy.mockReturnValue({
      OS: "android",
    } as typeof ReactNative.Platform);

    expect(
      isOldFirmwareUpdateUxSupported({
        lastSeenDeviceModelInfo,
        lastConnectedDevice,
      }),
    ).toEqual({
      updateSupported: false,
      updateSupportedButDeviceNotWired: true,
    });
  });

  it("should return { updateSupported:true, updateSupportedButDeviceNotWired: false } if device is wired", () => {
    isFirmwareUpdateVersionSupportedSpy.mockReturnValue(true);
    const lastConnectedDevice = {
      wired: true,
    } as Parameters<typeof isOldFirmwareUpdateUxSupported>[0]["lastConnectedDevice"];
    const lastSeenDeviceModelInfo = {} as DeviceModelInfo;

    PlatformSpy.mockReturnValue({
      OS: "android",
    } as typeof ReactNative.Platform);

    expect(
      isOldFirmwareUpdateUxSupported({
        lastSeenDeviceModelInfo,
        lastConnectedDevice,
      }),
    ).toEqual({
      updateSupported: true,
      updateSupportedButDeviceNotWired: false,
    });
  });
});
