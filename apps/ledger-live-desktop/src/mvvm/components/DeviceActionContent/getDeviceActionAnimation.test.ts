import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceAnimation as getDesktopDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import {
  getDeviceActionAnimation,
  getDeviceActionAnimationStyle,
  supportedDeviceActionModelIds,
} from "./getDeviceActionAnimation";

jest.mock("~/renderer/components/DeviceAction/animations", () => ({
  getDeviceAnimation: jest.fn(),
}));

const mockedGetDesktopDeviceAnimation = jest.mocked(getDesktopDeviceAnimation);

describe("getDeviceActionAnimation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetDesktopDeviceAnimation.mockReturnValue({ name: "test-animation" });
  });

  it("GIVEN desktop device models WHEN listing supported models THEN it supports every DeviceModelId except blue", () => {
    // GIVEN / WHEN / THEN
    expect(supportedDeviceActionModelIds).toEqual(
      Object.values(DeviceModelId).filter(modelId => modelId !== DeviceModelId.blue),
    );
    expect(supportedDeviceActionModelIds).not.toContain(DeviceModelId.blue);
  });

  it("GIVEN nanoS WHEN resolving its animation THEN it maps to Nano S Plus desktop animations", () => {
    // GIVEN / WHEN
    const animation = getDeviceActionAnimation({
      modelId: DeviceModelId.nanoS,
      action: "continue",
      theme: "dark",
    });

    // THEN
    expect(animation).toEqual({ name: "test-animation" });
    expect(mockedGetDesktopDeviceAnimation).toHaveBeenCalledWith(
      DeviceModelId.nanoSP,
      "dark",
      "openApp",
    );
  });

  it("GIVEN the continue action WHEN resolving its animation THEN it reuses the desktop continue-style animation", () => {
    // GIVEN / WHEN
    const animation = getDeviceActionAnimation({
      modelId: DeviceModelId.europa,
      action: "continue",
      theme: "dark",
    });

    // THEN
    expect(animation).toEqual({ name: "test-animation" });
    expect(mockedGetDesktopDeviceAnimation).toHaveBeenCalledWith(
      DeviceModelId.europa,
      "dark",
      "openApp",
    );
  });

  it("GIVEN the power-and-unlock action WHEN resolving its animation THEN it reuses the desktop enter-pin animation", () => {
    // GIVEN / WHEN
    const animation = getDeviceActionAnimation({
      modelId: DeviceModelId.apex,
      action: "power-and-unlock",
      theme: "light",
    });

    // THEN
    expect(animation).toEqual({ name: "test-animation" });
    expect(mockedGetDesktopDeviceAnimation).toHaveBeenCalledWith(
      DeviceModelId.apex,
      "light",
      "enterPinCode",
    );
  });

  it("GIVEN the blue device model WHEN resolving an animation THEN it returns undefined without calling the desktop helper", () => {
    // GIVEN / WHEN
    const animation = getDeviceActionAnimation({
      modelId: DeviceModelId.blue,
      action: "continue",
      theme: "light",
    });

    // THEN
    expect(animation).toBeUndefined();
    expect(mockedGetDesktopDeviceAnimation).not.toHaveBeenCalled();
  });

  it("GIVEN the desktop helper returns null WHEN resolving an animation THEN it returns undefined", () => {
    // GIVEN
    mockedGetDesktopDeviceAnimation.mockReturnValue(null);

    // WHEN
    const animation = getDeviceActionAnimation({
      modelId: DeviceModelId.nanoX,
      action: "continue",
      theme: "light",
    });

    // THEN
    expect(animation).toBeUndefined();
  });
});

describe("getDeviceActionAnimationStyle", () => {
  it.each(supportedDeviceActionModelIds)(
    "GIVEN %s WHEN resolving the animation style THEN it returns the 200x200 size",
    modelId => {
      // GIVEN / WHEN / THEN
      expect(getDeviceActionAnimationStyle(modelId)).toEqual({
        height: 200,
        width: 200,
      });
    },
  );

  it("GIVEN blue WHEN resolving the animation style THEN it returns an empty style", () => {
    // GIVEN / WHEN / THEN
    expect(getDeviceActionAnimationStyle(DeviceModelId.blue)).toEqual({});
  });
});
