import { DeviceModelId } from "@ledgerhq/types-devices";
import { OnboardingStep } from "@features/platform-device-onboarding";
import type { SetupInfoCard } from "@features/flow-device-onboarding-setup-info";
import {
  toSetupStage,
  type SetupIndicator,
  type SetupStageDetail,
  type SetupStageKind,
} from "./toSetupStage";

const stax = DeviceModelId.stax;
const nanoX = DeviceModelId.nanoX;

function stage(machineState: string, modelId: DeviceModelId = stax, reportsRecoveryKey = true) {
  return toSetupStage({ machineState, currentStep: null, modelId, reportsRecoveryKey });
}

function expectedStage(
  kind: SetupStageKind,
  index: number,
  total: number,
  indicator: SetupIndicator,
  extra: { detail?: SetupStageDetail; infoCard?: SetupInfoCard } = {},
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

  it("should skip the device name on a Nano", () => {
    expect(stage("deviceSetup.pin", nanoX)).toEqual(expectedStage("pin", 1, 4, "none"));
    expect(stage("deviceSetup.setupChoice", nanoX)).toEqual(
      expectedStage("setupChoice", 2, 4, "none", { infoCard: "setupChoice" }),
    );
    expect(stage("deviceSetup.newSeed", nanoX)).toEqual(
      expectedStage("security", 3, 4, "none", { infoCard: "recoveryPhrase" }),
    );
  });

  it("should show the setup choice before the security or restore step", () => {
    expect(stage("deviceSetup.setupChoice")).toEqual(
      expectedStage("setupChoice", 3, 5, "none", { infoCard: "setupChoice" }),
    );
  });

  it("should share the security stage for a new seed", () => {
    expect(stage("deviceSetup.newSeed")).toEqual(
      expectedStage("security", 4, 5, "none", { infoCard: "recoveryPhrase" }),
    );
  });

  it("should keep the Recovery Key backup on the security stage with its own description", () => {
    expect(stage("deviceSetup.backupRecoveryKey")).toEqual(
      expectedStage("security", 4, 5, "none", { detail: "recoveryKey", infoCard: "recoveryKey" }),
    );
  });

  it.each([
    ["deviceSetup.restoreChoice", "restoreChoice"],
    ["deviceSetup.restoreRecover", undefined],
    ["deviceSetup.restoreRecoveryKey", "restoreRecoveryKey"],
  ] as const)("should share the restore stage for %s", (machineState, infoCard) => {
    expect(stage(machineState)).toEqual(
      expectedStage("restore", 4, 5, "none", infoCard ? { infoCard } : {}),
    );
  });

  it("should keep the recovery phrase entry on the restore stage with its own description", () => {
    expect(stage("deviceSetup.restoreWords")).toEqual(
      expectedStage("restore", 4, 5, "none", {
        detail: "recoveryPhrase",
        infoCard: "recoveryPhrase",
      }),
    );
  });

  it.each(["checks.firmwareCheck", "deviceSetup.naming", "deviceSetup.pin"])(
    "should show no info card on %s",
    machineState => {
      expect(stage(machineState)?.infoCard).toBeUndefined();
    },
  );

  it.each(["deviceSetup.backupRecoveryKey", "deviceSetup.restoreRecoveryKey"])(
    "should hide the Recovery Key card on %s when the device reports no Recovery Key",
    machineState => {
      expect(stage(machineState, stax, false)?.infoCard).toBeUndefined();
    },
  );

  it("should keep the other cards when the device reports no Recovery Key", () => {
    expect(stage("deviceSetup.newSeed", nanoX, false)?.infoCard).toBe("recoveryPhrase");
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
        reportsRecoveryKey: true,
      }),
    ).toBeNull();
  });

  it("should keep the genuine check visible when a reconnect still reports the safety warning", () => {
    expect(
      toSetupStage({
        machineState: "checks.firmwareCheck",
        currentStep: OnboardingStep.SafetyWarning,
        modelId: stax,
        reportsRecoveryKey: true,
      }),
    ).toEqual(expectedStage("checks", 0, 5, "loading"));
  });
});
