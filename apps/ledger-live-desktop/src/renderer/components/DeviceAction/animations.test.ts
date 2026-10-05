import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceActionAnimation } from "@features/platform-device-action-content";
import type { AnimationLoader } from "~/renderer/animations";
import { getDeviceAnimation, type AnimationKey } from "./animations";

const isLoader = (source: unknown): source is AnimationLoader => typeof source === "function";

const ALL_KEYS = Object.keys({
  plugAndPinCode: true,
  enterPinCode: true,
  quitApp: true,
  allowManager: true,
  openApp: true,
  verify: true,
  sign: true,
  firmwareUpdating: true,
  installLoading: true,
  confirmLockscreen: true,
  recoverWithProtect: true,
  connectionSuccess: true,
  onboardingSuccess: true,
} satisfies Record<AnimationKey | "onboardingSuccess", true>) as (
  | AnimationKey
  | "onboardingSuccess"
)[];

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

  it("GIVEN every model, theme and key WHEN loading each code-split animation THEN it resolves to Lottie data", async () => {
    // GIVEN
    const loaders = new Set<AnimationLoader>();
    for (const modelId of Object.values(DeviceModelId)) {
      for (const theme of ["light", "dark"] as const) {
        for (const key of ALL_KEYS) {
          const source = getDeviceAnimation(modelId, theme, key);
          if (isLoader(source)) loaders.add(source);
        }
      }
    }

    // WHEN / THEN
    expect(loaders.size).toBeGreaterThan(0);
    for (const load of loaders) {
      const { default: data } = await load();
      expect(data).toEqual(expect.objectContaining({ layers: expect.any(Array) }));
    }
  });

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
