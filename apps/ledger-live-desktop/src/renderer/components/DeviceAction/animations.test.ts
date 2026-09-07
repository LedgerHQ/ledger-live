import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceActionAnimation } from "@features/platform-device-action-content";
import { getDeviceAnimation } from "./animations";

// This module is mocked by most of its consumers' tests, so it is only exercised here. The
// enterPinCode/openApp assets are owned by @features/platform-device-action-content: asserting
// identity against the package is what catches a pin/continue, light/dark or europa/flex
// transposition in the table.
describe("getDeviceAnimation", () => {
  const cases = [
    [DeviceModelId.nanoSP, "nanoSP"],
    [DeviceModelId.nanoX, "nanoX"],
    [DeviceModelId.stax, "stax"],
    [DeviceModelId.europa, "europa"],
    [DeviceModelId.apex, "apex"],
  ] as const;

  it.each(cases)(
    "GIVEN %s WHEN resolving enterPinCode THEN it returns the platform package's power-and-unlock asset",
    (modelId, platformModelId) => {
      // GIVEN / WHEN / THEN
      for (const theme of ["light", "dark"] as const) {
        expect(getDeviceAnimation(modelId, theme, "enterPinCode")).toBe(
          getDeviceActionAnimation({ modelId: platformModelId, action: "power-and-unlock", theme }),
        );
      }
    },
  );

  it.each(cases)(
    "GIVEN %s WHEN resolving openApp THEN it returns the platform package's continue asset",
    (modelId, platformModelId) => {
      // GIVEN / WHEN / THEN
      for (const theme of ["light", "dark"] as const) {
        expect(getDeviceAnimation(modelId, theme, "openApp")).toBe(
          getDeviceActionAnimation({ modelId: platformModelId, action: "continue", theme }),
        );
      }
    },
  );

  it("GIVEN a model without the requested key WHEN resolving THEN it returns null", () => {
    // GIVEN / WHEN / THEN
    expect(getDeviceAnimation(DeviceModelId.nanoX, "light", "confirmLockscreen")).toBeNull();
  });

  it("GIVEN an unrecognised model id WHEN resolving THEN it falls back to nanoX", () => {
    // GIVEN
    const unknownModelId = "notADevice" as DeviceModelId;

    // WHEN / THEN
    expect(getDeviceAnimation(unknownModelId, "light", "openApp")).toBe(
      getDeviceAnimation(DeviceModelId.nanoX, "light", "openApp"),
    );
  });

  it("GIVEN OVERRIDE_MODEL_ID WHEN resolving THEN it overrides the requested model", () => {
    // GIVEN
    const previous = process.env.OVERRIDE_MODEL_ID;
    process.env.OVERRIDE_MODEL_ID = DeviceModelId.stax;

    try {
      // WHEN / THEN
      expect(getDeviceAnimation(DeviceModelId.nanoX, "light", "openApp")).toBe(
        getDeviceActionAnimation({ modelId: "stax", action: "continue", theme: "light" }),
      );
    } finally {
      if (previous === undefined) delete process.env.OVERRIDE_MODEL_ID;
      else process.env.OVERRIDE_MODEL_ID = previous;
    }
  });
});
