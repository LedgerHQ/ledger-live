import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { OnboardingStep } from "@features/platform-device-onboarding";
import {
  toSetupStage,
  type SetupIndicator,
  type SetupStageDetail,
  type SetupStageKind,
} from "./toSetupStage";

const stax = DeviceModelId.STAX;
const nanoX = DeviceModelId.NANO_X;

function stage(machineState: string, modelId: string = stax) {
  return toSetupStage({ machineState, currentStep: null, modelId });
}

function heldUpdateStage(machineState: string, osCheck = false) {
  return toSetupStage({
    machineState,
    currentStep: null,
    modelId: nanoX,
    updateAfterSetup: true,
    osCheck,
  });
}

function expectedStage(
  kind: SetupStageKind,
  index: number,
  total: number,
  indicator: SetupIndicator,
  extra: { detail?: SetupStageDetail } = {},
) {
  return { index, total, kind, indicator, ...extra };
}

describe("toSetupStage", () => {
  it.each([
    ["checks.genuineCheck.awaitingApproval", "loading"],
    ["checks.firmwareCheck", "loading"],
    ["checks.firmwareUpdateOffered", "loading"],
    ["checks.genuineFailed", "loading"],
    ["checks.notGenuineSupport", "loading"],
    ["checks.checksSucceeded", "success"],
    ["checks.checksDone", "success"],
    ["checks.leavingEarlyCheckScreen", "success"],
  ] as const)("should keep %s on the genuine check stage (%s)", (machineState, indicator) => {
    expect(stage(machineState)).toEqual(expectedStage("checks", 0, 5, indicator));
  });

  it("should show the device name after the genuine check on a touchscreen", () => {
    expect(stage("deviceSetup.naming")).toEqual(expectedStage("naming", 1, 5, "none"));
  });

  it("should show the PIN after the device name on a touchscreen", () => {
    expect(stage("deviceSetup.pin")).toEqual(expectedStage("pin", 2, 5, "none"));
  });

  it("should skip the device name on a Nano and ask the setup choice before the PIN", () => {
    expect(stage("checks.firmwareCheck", nanoX)).toEqual(expectedStage("checks", 0, 4, "loading"));
    expect(stage("deviceSetup.setupChoice", nanoX)).toEqual(
      expectedStage("setupChoice", 1, 4, "none"),
    );
    expect(stage("deviceSetup.pin", nanoX)).toEqual(expectedStage("pin", 2, 4, "none"));
    expect(stage("deviceSetup.newSeed", nanoX)).toEqual(expectedStage("security", 3, 4, "none"));
  });

  describe("on a Nano that updates its OS after setup", () => {
    it.each([
      ["checks.genuineCheck.running", "loading"],
      ["checks.checksDone", "success"],
    ] as const)("should show %s as the genuine check alone (%s)", (machineState, indicator) => {
      expect(heldUpdateStage(machineState)).toEqual(expectedStage("genuine", 0, 5, indicator));
    });

    it("should keep the setup steps in the device order", () => {
      expect(heldUpdateStage("deviceSetup.setupChoice")?.index).toBe(1);
      expect(heldUpdateStage("deviceSetup.pin")?.index).toBe(2);
      expect(heldUpdateStage("deviceSetup.newSeed")?.index).toBe(3);
      expect(heldUpdateStage("deviceSetup.restoreWords")?.index).toBe(3);
    });

    it.each([
      ["postSetupFirmware.firmwareCheck", "loading"],
      ["postSetupFirmware.firmwareUpdateOffered", "loading"],
      ["checks.genuineCheck.running", "loading"],
      ["checks.checksSucceeded", "success"],
      ["setupExit", "success"],
    ] as const)("should show %s as the last OS check (%s)", (machineState, indicator) => {
      expect(heldUpdateStage(machineState, true)).toEqual(
        expectedStage("osCheck", 4, 5, indicator),
      );
    });

    it("should not show the OS check on a device that checked its OS before setup", () => {
      expect(
        toSetupStage({
          machineState: "setupExit",
          currentStep: null,
          modelId: nanoX,
          osCheck: true,
        }),
      ).toBeNull();
    });
  });

  it("should show the setup choice before the security or restore step", () => {
    expect(stage("deviceSetup.setupChoice")).toEqual(expectedStage("setupChoice", 3, 5, "none"));
  });

  it("should share the security stage for a new seed", () => {
    expect(stage("deviceSetup.newSeed")).toEqual(expectedStage("security", 4, 5, "none"));
  });

  it("should keep the Recovery Key backup on the security stage with its own description", () => {
    expect(stage("deviceSetup.backupRecoveryKey")).toEqual(
      expectedStage("security", 4, 5, "none", { detail: "recoveryKey" }),
    );
  });

  it.each([
    "deviceSetup.restoreChoice",
    "deviceSetup.restoreRecover",
    "deviceSetup.restoreRecoveryKey",
  ])("should share the restore stage for %s", machineState => {
    expect(stage(machineState)).toEqual(expectedStage("restore", 4, 5, "none"));
  });

  it("should keep the recovery phrase entry on the restore stage with its own description", () => {
    expect(stage("deviceSetup.restoreWords")).toEqual(
      expectedStage("restore", 4, 5, "none", { detail: "recoveryPhrase" }),
    );
  });

  it("should leave deviceSetup.waiting off the setup screen", () => {
    expect(stage("deviceSetup.waiting")).toBeNull();
  });

  it("should keep the stage already shown during the safety warning", () => {
    expect(
      toSetupStage({
        machineState: "deviceSetup.pin",
        currentStep: OnboardingStep.SafetyWarning,
        modelId: stax,
      }),
    ).toBeNull();
  });

  it("should keep the genuine check visible when a reconnect still reports the safety warning", () => {
    expect(
      toSetupStage({
        machineState: "checks.firmwareCheck",
        currentStep: OnboardingStep.SafetyWarning,
        modelId: stax,
      }),
    ).toEqual(expectedStage("checks", 0, 5, "loading"));
  });
});
