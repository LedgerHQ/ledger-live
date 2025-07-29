import { filterIgnoredFirmwareUpdates } from "../filterIgnoredFirmwareUpdates";
import type { GetLatestAvailableFirmwareActionState } from "../../actions/getLatestAvailableFirmware";

describe("filterIgnoredFirmwareUpdates", () => {
  const createMockState = (
    status: GetLatestAvailableFirmwareActionState["status"],
    firmwareName?: string,
  ): GetLatestAvailableFirmwareActionState => ({
    status,
    firmwareUpdateContext: firmwareName
      ? {
          final: { name: firmwareName } as any,
          osu: {} as any,
          shouldFlashMCU: false,
        }
      : null,
    deviceInfo: null,
    error: null,
    lockedDevice: false,
  });

  describe("when status is not 'available-firmware'", () => {
    it("should return the original state unchanged", () => {
      const state = createMockState("no-available-firmware");
      const result = filterIgnoredFirmwareUpdates(state, ["2.1.0"]);
      expect(result).toEqual(state);
    });

    it("should return the original state when status is 'error'", () => {
      const state = createMockState("error");
      const result = filterIgnoredFirmwareUpdates(state, ["2.1.0"]);
      expect(result).toEqual(state);
    });
  });

  describe("when ignoredOSUpdates is undefined", () => {
    it("should return the original state unchanged", () => {
      const state = createMockState("available-firmware", "2.1.0");
      const result = filterIgnoredFirmwareUpdates(state, undefined);
      expect(result).toEqual(state);
    });
  });

  describe("when ignoredOSUpdates is empty array", () => {
    it("should return the original state unchanged", () => {
      const state = createMockState("available-firmware", "2.1.0");
      const result = filterIgnoredFirmwareUpdates(state, []);
      expect(result).toEqual(state);
    });
  });

  describe("when firmwareUpdateContext is null", () => {
    it("should return the original state unchanged", () => {
      const state = createMockState("available-firmware");
      const result = filterIgnoredFirmwareUpdates(state, ["2.1.0"]);
      expect(result).toEqual(state);
    });
  });

  describe("when firmwareUpdateContext.final.name is undefined", () => {
    it("should return the original state unchanged", () => {
      const state = createMockState("available-firmware", "2.1.0");
      state.firmwareUpdateContext!.final.name = undefined as any;
      const result = filterIgnoredFirmwareUpdates(state, ["2.1.0"]);
      expect(result).toEqual(state);
    });
  });

  describe("when firmware version is not in ignored list", () => {
    it("should return the original state unchanged", () => {
      const state = createMockState("available-firmware", "2.1.0");
      const result = filterIgnoredFirmwareUpdates(state, ["2.0.0", "2.2.0"]);
      expect(result).toEqual(state);
    });
  });

  describe("when firmware version is in ignored list", () => {
    it("should filter out the firmware and change status to 'no-available-firmware'", () => {
      const state = createMockState("available-firmware", "2.1.0");
      const result = filterIgnoredFirmwareUpdates(state, ["2.1.0", "2.2.0"]);

      expect(result).toEqual({
        ...state,
        firmwareUpdateContext: null,
        status: "no-available-firmware",
      });
    });

    it("should filter out the firmware when it's the only ignored version", () => {
      const state = createMockState("available-firmware", "2.1.0");
      const result = filterIgnoredFirmwareUpdates(state, ["2.1.0"]);

      expect(result).toEqual({
        ...state,
        firmwareUpdateContext: null,
        status: "no-available-firmware",
      });
    });
  });

  describe("edge cases", () => {
    it("should handle case-sensitive firmware version matching", () => {
      const state = createMockState("available-firmware", "2.1.0");
      const result = filterIgnoredFirmwareUpdates(state, ["2.1.0", "2.1.0-rc1"]);
      expect(result).toEqual({
        ...state,
        firmwareUpdateContext: null,
        status: "no-available-firmware",
      });
    });

    it("should not filter when firmware version is similar but not exact match", () => {
      const state = createMockState("available-firmware", "2.1.0");
      const result = filterIgnoredFirmwareUpdates(state, ["2.1.0-rc1", "2.1.1"]);
      expect(result).toEqual(state);
    });

    it("should preserve all other state properties when filtering", () => {
      const state = createMockState("available-firmware", "2.1.0");
      state.lockedDevice = true;
      state.error = { type: "SharedError", message: "Test", name: "TestError", retrying: false };

      const result = filterIgnoredFirmwareUpdates(state, ["2.1.0"]);

      expect(result).toEqual({
        ...state,
        firmwareUpdateContext: null,
        status: "no-available-firmware",
      });
    });
  });
});
