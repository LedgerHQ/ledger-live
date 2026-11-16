import type { GetOsVersionResponse } from "@ledgerhq/device-management-kit";
import { DeviceReadyTarget } from "../types";
import { isTargetReached } from "./isTargetReached";

const osVersion = (overrides: { isBootloader?: boolean; isOsu?: boolean } = {}) =>
  ({ isBootloader: false, isOsu: false, ...overrides }) as GetOsVersionResponse;

const ON_OS = osVersion();
const IN_BOOTLOADER = osVersion({ isBootloader: true });
const IN_OSU = osVersion({ isOsu: true });

describe("isTargetReached", () => {
  describe("success", () => {
    it("should reach the updated OS target only outside of bootloader and OSU mode", () => {
      expect(isTargetReached(ON_OS, DeviceReadyTarget.UpdatedOs)).toBe(true);
      expect(isTargetReached(IN_OSU, DeviceReadyTarget.UpdatedOs)).toBe(false);
      expect(isTargetReached(IN_BOOTLOADER, DeviceReadyTarget.UpdatedOs)).toBe(false);
    });

    it("should let the caller branch on the answer itself mid flash loop", () => {
      expect(isTargetReached(ON_OS, DeviceReadyTarget.AnyResponse)).toBe(true);
      expect(isTargetReached(IN_BOOTLOADER, DeviceReadyTarget.AnyResponse)).toBe(true);
      expect(isTargetReached(IN_OSU, DeviceReadyTarget.AnyResponse)).toBe(true);
    });
  });
});
