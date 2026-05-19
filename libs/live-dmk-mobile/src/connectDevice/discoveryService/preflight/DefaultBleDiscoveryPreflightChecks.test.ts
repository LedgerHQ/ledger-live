import { Platform } from "react-native";
import { AndroidBleDiscoveryPreflightChecks } from "./android/AndroidBleDiscoveryPreflightChecks";
import { DefaultBleDiscoveryPreflightChecks } from "./DefaultBleDiscoveryPreflightChecks";
import { IosBleDiscoveryPreflightChecks } from "./ios/IosBleDiscoveryPreflightChecks";
import type { DiscoveryPreflightChecks, DiscoveryPreflightResult } from "./preflightResult";

jest.mock("./android/AndroidBleDiscoveryPreflightChecks", () => ({
  AndroidBleDiscoveryPreflightChecks: jest.fn().mockImplementation(() => ({
    getPreflight: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

jest.mock("./ios/IosBleDiscoveryPreflightChecks", () => ({
  IosBleDiscoveryPreflightChecks: jest.fn().mockImplementation(() => ({
    getPreflight: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

describe("DefaultBleDiscoveryPreflightChecks", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("GIVEN Android platform, WHEN running default preflight, THEN it should use Android preflight checks", async () => {
    // GIVEN
    const preflightChecks = new DefaultBleDiscoveryPreflightChecks(undefined, "android");

    // WHEN
    const result = preflightChecks.getPreflight();

    // THEN
    await expect(result).resolves.toEqual({
      success: true,
    });
    expect(AndroidBleDiscoveryPreflightChecks).toHaveBeenCalledTimes(1);
    expect(IosBleDiscoveryPreflightChecks).not.toHaveBeenCalled();
  });

  it("GIVEN iOS platform, WHEN running default preflight, THEN it should use iOS preflight checks", async () => {
    // GIVEN
    const preflightChecks = new DefaultBleDiscoveryPreflightChecks(undefined, "ios");

    // WHEN
    const result = preflightChecks.getPreflight();

    // THEN
    await expect(result).resolves.toEqual({
      success: true,
    });
    expect(IosBleDiscoveryPreflightChecks).toHaveBeenCalledTimes(1);
    expect(AndroidBleDiscoveryPreflightChecks).not.toHaveBeenCalled();
  });

  it("GIVEN an unsupported platform, WHEN running default preflight, THEN it should resolve successfully", async () => {
    // GIVEN
    const preflightChecks = new DefaultBleDiscoveryPreflightChecks(
      undefined,
      "windows" as typeof Platform.OS,
    );

    // WHEN
    const result = preflightChecks.getPreflight();

    // THEN
    await expect(result).resolves.toEqual({ success: true });
    expect(AndroidBleDiscoveryPreflightChecks).not.toHaveBeenCalled();
    expect(IosBleDiscoveryPreflightChecks).not.toHaveBeenCalled();
  });

  it("GIVEN injected preflight checks, WHEN running default preflight, THEN it should delegate to them", async () => {
    // GIVEN
    const result: DiscoveryPreflightResult = { success: true };
    const injectedPreflightChecks: DiscoveryPreflightChecks = {
      getPreflight: jest.fn().mockResolvedValue(result),
    };
    const preflightChecks = new DefaultBleDiscoveryPreflightChecks(injectedPreflightChecks);

    // WHEN
    const preflightResult = preflightChecks.getPreflight();

    // THEN
    await expect(preflightResult).resolves.toBe(result);
    expect(injectedPreflightChecks.getPreflight).toHaveBeenCalledTimes(1);
  });
});
