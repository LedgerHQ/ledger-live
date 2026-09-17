import * as braze from "@braze/web-sdk";
import { requireBrazeLifecycleMethod } from "../brazeWebSdkLifecycle";

describe("requireBrazeLifecycleMethod", () => {
  const brazeMock = jest.requireMock("@braze/web-sdk") as Record<string, unknown>;
  const originalWipeData = brazeMock.wipeData;
  const originalEnableSDK = brazeMock.enableSDK;

  afterEach(() => {
    brazeMock.wipeData = originalWipeData;
    brazeMock.enableSDK = originalEnableSDK;
  });

  it("should throw when the SDK method is missing", () => {
    brazeMock.wipeData = undefined;

    expect(() => requireBrazeLifecycleMethod("wipeData")).toThrow("Braze SDK is missing wipeData");
  });

  it("should throw when the SDK method is not a function", () => {
    brazeMock.enableSDK = "not-a-function";

    expect(() => requireBrazeLifecycleMethod("enableSDK")).toThrow(
      "Braze SDK is missing enableSDK",
    );
  });

  it("should return a callable SDK method when it exists", () => {
    const wipeData = requireBrazeLifecycleMethod("wipeData");

    wipeData();

    expect(jest.mocked(braze.wipeData)).toHaveBeenCalledTimes(1);
  });
});
