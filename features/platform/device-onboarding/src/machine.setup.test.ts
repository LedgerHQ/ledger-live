import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { settle } from "./__tests__/actorHarness";
import { OnboardingStep, RecoveryKeyStatus, SeedPath } from "./types";
import type { FakeOnboardingDmk } from "./tests/fakeDmk";
import {
  enterSetup,
  exitOf,
  expectChecksPassed,
  follow,
  launch,
  os,
  passingChecks,
  seeded,
  start,
  stateOf,
  stepChanged,
  unseeded,
  wait,
  type OnboardingActor,
} from "./__tests__/machineHarness";
import type { OsVersionResponseOptions } from "./tests/osVersionResponse";

describe("device setup", () => {
  it("waits for the device to leave welcome instead of guessing naming or pin", async () => {
    const { actor } = await enterSetup();

    expect(stateOf(actor)).toBe("waiting");
    expect(actor.getSnapshot().context.currentSetupStep).toBeNull();
    actor.stop();
  });

  it("stays on the Recovery Key backup while the device still reports itself ready", async () => {
    const { actor } = await enterSetup();

    await follow(actor, [
      OnboardingStep.ChooseName,
      OnboardingStep.Pin,
      OnboardingStep.SetupChoice,
      OnboardingStep.NewDevice,
      OnboardingStep.NewDeviceConfirming,
    ]);

    expect(stateOf(actor)).toBe("newSeed");

    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Choice,
      }),
    );

    expect(actor.getSnapshot().status).not.toBe("done");
    expect(stateOf(actor)).toBe("backupRecoveryKey");
    expect(actor.getSnapshot().context.lastDeviceState?.recoveryKeyStatus).toBe(
      RecoveryKeyStatus.Choice,
    );

    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Running,
      }),
    );
    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Naming,
      }),
    );

    expect(stateOf(actor)).toBe("backupRecoveryKey");

    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Ready,
      }),
    );

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(actor.getSnapshot().context.seedPath).toBe(SeedPath.NewSeed);
  });

  it.each([RecoveryKeyStatus.Choice, RecoveryKeyStatus.Running, RecoveryKeyStatus.Naming])(
    "sends an already onboarded device to the success exit while its Recovery Key flag is %s",
    async recoveryKeyStatus => {
      const { actor } = await start({
        osVersion: [os({ ...seeded, recoveryKeyStatus })],
        ...passingChecks,
      });

      expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    },
  );

  it("keeps a rebooted Recovery Key backup instead of starting onboarding over", async () => {
    const { actor } = await enterSetup();

    actor.send(stepChanged(OnboardingStep.NewDevice));
    actor.send(
      stepChanged(OnboardingStep.WelcomeScreen1, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Running,
      }),
    );

    expect(actor.getSnapshot().status).not.toBe("done");
    expect(stateOf(actor)).toBe("backupRecoveryKey");
    actor.stop();
  });

  it.each([RecoveryKeyStatus.Ready, RecoveryKeyStatus.Rejected])(
    "finishes a rebooted Recovery Key backup once it is %s",
    async status => {
      const { actor } = await enterSetup();

      actor.send(stepChanged(OnboardingStep.NewDevice));
      actor.send(
        stepChanged(OnboardingStep.WelcomeScreen1, {
          isOnboarded: true,
          recoveryKeyStatus: RecoveryKeyStatus.Running,
        }),
      );
      actor.send(
        stepChanged(OnboardingStep.WelcomeScreen1, {
          isOnboarded: true,
          recoveryKeyStatus: status,
        }),
      );

      expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    },
  );

  it("does not finish while the Recovery Key flag cannot be read", async () => {
    const { actor } = await enterSetup();

    actor.send(stepChanged(OnboardingStep.NewDevice));
    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Choice,
      }),
    );
    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Unknown,
      }),
    );

    expect(actor.getSnapshot().status).not.toBe("done");
    expect(stateOf(actor)).toBe("backupRecoveryKey");
    actor.stop();
  });

  it("finishes when the device is ready and the Recovery Key flag was never read", async () => {
    const { actor } = await enterSetup();

    actor.send(stepChanged(OnboardingStep.NewDevice));
    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Unknown,
      }),
    );

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
  });

  it("keeps the Recovery Key backup open when the flag stays unreadable across a reboot", async () => {
    const { actor } = await enterSetup();

    actor.send(stepChanged(OnboardingStep.NewDevice));
    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Choice,
      }),
    );
    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Unknown,
      }),
    );
    actor.send(
      stepChanged(OnboardingStep.WelcomeScreen1, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Unknown,
      }),
    );
    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Unknown,
      }),
    );

    expect(actor.getSnapshot().status).not.toBe("done");
    expect(stateOf(actor)).toBe("backupRecoveryKey");
    actor.stop();
  });

  it("finishes when the Recovery Key backup is refused", async () => {
    const { actor } = await enterSetup();

    actor.send(stepChanged(OnboardingStep.NewDevice));
    actor.send(
      stepChanged(OnboardingStep.Ready, {
        isOnboarded: true,
        recoveryKeyStatus: RecoveryKeyStatus.Rejected,
      }),
    );

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
  });

  it("follows a new seed on a touchscreen straight to done", async () => {
    const { actor } = await enterSetup({ offerSync: true });

    await follow(actor, [
      OnboardingStep.ChooseName,
      OnboardingStep.Pin,
      OnboardingStep.SetupChoice,
      OnboardingStep.NewDevice,
      OnboardingStep.NewDeviceConfirming,
    ]);

    expect(actor.getSnapshot().context.seedPath).toBe(SeedPath.NewSeed);

    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(actor.getSnapshot().context.seedPath).toBe(SeedPath.NewSeed);
  });

  it("knows a new seed first seen on its confirmation step", async () => {
    const { actor } = await enterSetup();

    await follow(actor, [OnboardingStep.Pin, OnboardingStep.NewDeviceConfirming]);
    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(actor.getSnapshot().context.seedPath).toBe(SeedPath.NewSeed);
  });

  it("skips naming on a nano and still reaches done", async () => {
    const { actor } = await enterSetup({ deviceModelId: DeviceModelId.NANO_X });

    await follow(actor, [OnboardingStep.Pin, OnboardingStep.SetupChoice, OnboardingStep.NewDevice]);
    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(actor.getSnapshot().context.seedPath).toBe(SeedPath.NewSeed);
  });

  it("advances the word index while restoring a recovery phrase", async () => {
    const { actor } = await enterSetup();

    await follow(actor, [
      OnboardingStep.Pin,
      OnboardingStep.SetupChoice,
      OnboardingStep.SetupChoiceRestore,
    ]);
    actor.send(stepChanged(OnboardingStep.RestoreSeed, { seedWordIndex: 0 }));
    actor.send(stepChanged(OnboardingStep.RestoreSeed, { seedWordIndex: 7 }));

    expect(stateOf(actor)).toBe("restoreWords");
    expect(actor.getSnapshot().context.lastDeviceState?.seedWordIndex).toBe(7);

    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(actor.getSnapshot().context.seedPath).toBe(SeedPath.RestorePhrase);
  });

  it("follows a Recover restore to done", async () => {
    const { actor } = await enterSetup();

    await follow(actor, [
      OnboardingStep.Pin,
      OnboardingStep.SetupChoice,
      OnboardingStep.SetupChoiceRestore,
      OnboardingStep.RecoverRestore,
    ]);
    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(actor.getSnapshot().context.seedPath).toBe(SeedPath.Recover);
  });

  it("follows a Recovery Key restore to done", async () => {
    const { actor } = await enterSetup();

    await follow(actor, [
      OnboardingStep.Pin,
      OnboardingStep.SetupChoice,
      OnboardingStep.SetupChoiceRestore,
      OnboardingStep.RestoreCharon,
    ]);
    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(actor.getSnapshot().context.seedPath).toBe(SeedPath.RecoveryKey);
  });

  it("clears the seed path when the device restarts and records the next one", async () => {
    const { actor } = await enterSetup();

    actor.send(stepChanged(OnboardingStep.NewDevice));
    expect(actor.getSnapshot().context.seedPath).toBe(SeedPath.NewSeed);

    actor.send(stepChanged(OnboardingStep.WelcomeScreen1));
    await settle();

    expect(actor.getSnapshot().context.seedPath).toBeNull();
    await expectChecksPassed(actor);

    actor.send(stepChanged(OnboardingStep.RestoreSeed));

    expect(actor.getSnapshot().context.seedPath).toBe(SeedPath.RestorePhrase);
    actor.stop();
  });

  it("returns to routing when the device goes back to welcome after setup has started", async () => {
    const { actor } = await enterSetup();

    actor.send(stepChanged(OnboardingStep.Pin));
    actor.send(stepChanged(OnboardingStep.WelcomeScreen1));
    await settle();

    await expectChecksPassed(actor);
    expect(actor.getSnapshot().context.currentSetupStep).toBeNull();
    actor.stop();
  });

  it("stays put on a step it does not map, until the device is ready", async () => {
    const { actor } = await enterSetup();

    actor.send(stepChanged(OnboardingStep.Pin));
    actor.send(stepChanged(OnboardingStep.SafetyWarning));

    expect(stateOf(actor)).toBe("pin");

    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
  });

  it("finishes a device that was just set up without offering Ledger Sync", async () => {
    const { actor } = await enterSetup({ offerSync: true });

    actor.send(stepChanged(OnboardingStep.Pin));
    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
  });

  it("still treats a device as unseeded after a seed appears mid-setup", async () => {
    const { actor } = await start(
      {
        osVersion: [os(unseeded), os({ ...unseeded, onboardingState: "pin", isOnboarded: true })],
        ...passingChecks,
      },
      { offerSync: true },
    );

    actor.send(stepChanged(OnboardingStep.Pin, { isOnboarded: true }));
    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expect(actor.getSnapshot().status).not.toBe("done");
    expect(stateOf(actor)).toBe("pin");
    expect(actor.getSnapshot().context.onboardedOnEntry).toBe(false);
    actor.stop();
  });

  it("exits on the session the app reported last, not the one the machine started with", async () => {
    const { actor } = await enterSetup();

    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY", sessionId: "session-2" });
    await settle();
    actor.send({ type: "CONTINUE" });
    await settle();
    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toEqual({
      sessionId: "session-2",
      device: { id: "device", modelId: DeviceModelId.FLEX },
      reason: "completed",
    });
  });

  it("reports its session when an already onboarded device completes", async () => {
    const { actor } = await launch({ osVersion: [os(seeded)], ...passingChecks });

    actor.send({ type: "CONTINUE" });
    await settle();
    actor.send({ type: "CONTINUE" });
    await settle();

    expect(exitOf(actor)).toEqual({
      sessionId: "session",
      device: { id: "device", modelId: DeviceModelId.FLEX },
      reason: "completed",
    });
  });

  it("should pause seed polling only while the device is being set up", async () => {
    const seededRun = await launch({ osVersion: [os(seeded)], ...passingChecks });
    const seededState = stateOf(seededRun.actor);

    seededRun.actor.send({ type: "PAUSE_POLLING" });
    await settle();

    expect(stateOf(seededRun.actor)).toBe(seededState);
    expect(seededRun.actor.getSnapshot().context.pollingPaused).toBe(false);
    seededRun.actor.stop();

    const { actor, fake } = await enterSetup();
    actor.send(stepChanged(OnboardingStep.RecoverRestore));
    await settle();
    expect(actor.getSnapshot().context.pollingPaused).toBe(false);

    actor.send({ type: "PAUSE_POLLING" });
    await settle();

    expect(stateOf(actor)).toBe("restoreRecover");
    expect(actor.getSnapshot().context.pollingPaused).toBe(true);
    const callsWhilePaused = fake.sendCommand.mock.calls.length;

    await settle();
    expect(fake.sendCommand.mock.calls.length).toBe(callsWhilePaused);

    actor.send({ type: "RESUME_POLLING" });
    await settle();
    expect(actor.getSnapshot().context.pollingPaused).toBe(false);
  });

  it("keeps polling paused across a lock while Recover owns the device", async () => {
    const { actor, fake } = await startOnRecoverRestore();

    actor.send({ type: "PAUSE_POLLING" });
    await settle();
    const unlock = lockDevice(fake);
    actor.send({ type: "LOCKED" });
    await settle();
    expect(stateOf(actor)).toBe("deviceLocked");

    unlock();
    await wait(1100);
    await settle();
    const callsWhenBack = fake.sendCommand.mock.calls.length;
    await wait(1100);

    expect(stateOf(actor)).toBe("waiting");
    expect(actor.getSnapshot().context.pollingPaused).toBe(true);
    expect(fake.sendCommand.mock.calls.length).toBe(callsWhenBack);

    actor.send({ type: "RESUME_POLLING" });
    await settle();
    expect(stateOf(actor)).toBe("restoreRecover");
    expect(actor.getSnapshot().context.pollingPaused).toBe(false);
    actor.stop();
  });

  it("clears the pause on a resume sent while the device is locked", async () => {
    const { actor, fake } = await startOnRecoverRestore();

    actor.send({ type: "PAUSE_POLLING" });
    await settle();
    const unlock = lockDevice(fake);
    actor.send({ type: "LOCKED" });
    await settle();
    actor.send({ type: "RESUME_POLLING" });
    await settle();

    expect(stateOf(actor)).toBe("deviceLocked");
    expect(actor.getSnapshot().context.pollingPaused).toBe(false);

    unlock();
    await wait(1100);
    await settle();
    expect(stateOf(actor)).toBe("restoreRecover");
    actor.stop();
  });

  it("polls the device for the whole setup phase and stops once it has exited", async () => {
    const { actor, fake } = await launch(
      { osVersion: [os({ ...unseeded, seVersion: "2.4.0" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_X },
    );
    const commandsBeforeSetup = fake.sendCommand.mock.calls.length;

    actor.send({ type: "CONTINUE" });
    await settle();
    actor.send({ type: "CONTINUE" });
    await settle();

    expect(fake.sendCommand.mock.calls.length).toBeGreaterThan(commandsBeforeSetup);

    actor.send(stepChanged(OnboardingStep.Ready));
    const commandsOnceDone = fake.sendCommand.mock.calls.length;

    jest.useFakeTimers();
    await jest.advanceTimersByTimeAsync(3_000);
    jest.useRealTimers();

    expect(fake.sendCommand.mock.calls.length).toBe(commandsOnceDone);
  });
});

function startOnRecoverRestore(): Promise<{ actor: OnboardingActor; fake: FakeOnboardingDmk }> {
  const recoverRestore: OsVersionResponseOptions = {
    ...unseeded,
    onboardingState: "restore-recover-backup",
  };
  return start({ osVersion: [os(unseeded), os(recoverRestore)], ...passingChecks });
}

// Every command fails until the returned function lets them through again.
function lockDevice(fake: FakeOnboardingDmk): () => void {
  const answer = fake.sendCommand.getMockImplementation();
  fake.sendCommand.mockImplementation(() => Promise.reject(new Error("device is locked")));

  return () => {
    if (answer) fake.sendCommand.mockImplementation(answer);
  };
}
