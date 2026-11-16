import { NativeModules } from "react-native";
import { getProcessStartTime } from "./processStartTime";

describe("getProcessStartTime", () => {
  afterEach(() => {
    delete NativeModules.AppStartupModule;
  });

  it("returns the app process start time from the native module", () => {
    NativeModules.AppStartupModule = { getProcessStartTime: () => 1_700_000_000_000 };

    expect(getProcessStartTime()).toBe(1_700_000_000_000);
  });

  it("returns null when the process was not started to show the app", () => {
    NativeModules.AppStartupModule = { getProcessStartTime: () => null };

    expect(getProcessStartTime()).toBeNull();
  });

  it("returns null when the native module returns undefined", () => {
    NativeModules.AppStartupModule = { getProcessStartTime: () => undefined };

    expect(getProcessStartTime()).toBeNull();
  });

  it("returns null when the native module is not linked", () => {
    expect(getProcessStartTime()).toBeNull();
  });

  it("lets a native failure reach the caller", () => {
    NativeModules.AppStartupModule = {
      getProcessStartTime: () => {
        throw new Error("native failure");
      },
    };

    expect(() => getProcessStartTime()).toThrow("native failure");
  });
});
