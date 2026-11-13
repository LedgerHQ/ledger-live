import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { EarlyCheckToggle } from "./device/toggleEarlyCheckCommand";
import { settle } from "./tests/actorHarness";
import { type OnboardingDmkScript } from "./tests/fakeDmk";
import { OnboardingStep, type DeviceOnboardingContext } from "./types";
import {
  type OnboardingActor,
  availableUpdate,
  checkFailure,
  deviceRefusal,
  exitOf,
  expectChecksPassed,
  genuine,
  handOverAfterReboot,
  handOverAndReturn,
  handoverScript,
  launch,
  leaveSuccessScreen,
  os,
  seeded,
  settleRetries,
  start,
  stateOf,
  stepChanged,
  unseeded,
  upToDate,
  updateAvailable,
} from "./tests/machineHarness";

describe("the firmware check", () => {
  it("offers an available update", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [updateAvailable],
    });

    expect(stateOf(actor)).toBe("firmwareUpdateOffered");
    expect(actor.getSnapshot().context.firmware).toEqual({
      kind: "offered",
      update: availableUpdate,
    });
  });

  it("carries on when the user declines it, and forgets it", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [updateAvailable],
    });

    actor.send({ type: "USER_DECLINE" });
    await settle();

    await expectChecksPassed(actor);
    expect(actor.getSnapshot().context.firmware).toEqual({ kind: "declined" });
  });

  it("keeps the offer standing when the user closes the drawer over it", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [updateAvailable],
    });

    actor.send({ type: "CLOSE" });
    await settle();

    expect(stateOf(actor)).toBe("firmwareUpdateOffered");
    expect(actor.getSnapshot().context.firmware).toEqual({
      kind: "offered",
      update: availableUpdate,
    });
  });

  it("still installs the update the user accepts from the step screen", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [updateAvailable],
    });

    actor.send({ type: "CLOSE" });
    actor.send({ type: "USER_ACCEPT" });
    await settle();

    expect(stateOf(actor)).toBe("firmwareUpdateDelegated");
  });

  it.each([
    ["a lock the device took on its own", "LOCKED", "UNLOCKED"],
    ["the transport dropping under the question", "TRANSPORT_LOST", "SESSION_READY"],
  ] as const)("offers the update again after %s", async (_case, interrupt, resume) => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [updateAvailable, updateAvailable],
    });

    actor.send({ type: interrupt });
    actor.send(
      resume === "SESSION_READY" ? { type: resume, sessionId: "session" } : { type: resume },
    );
    await settle();

    expect(stateOf(actor)).toBe("firmwareUpdateOffered");
  });

  it("offers a retry and a skip when the catalogue is unreachable", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [checkFailure],
    });

    expect(stateOf(actor)).toBe("firmwareCheckFailed");
  });

  it("runs again on a retry", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [checkFailure, upToDate],
    });

    actor.send({ type: "RETRY" });
    await settle();

    await expectChecksPassed(actor);
  });

  it("lets the user skip a check it could not complete", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [checkFailure],
    });

    actor.send({ type: "SKIP" });
    await settle();

    await expectChecksPassed(actor);
    expect(actor.getSnapshot().context.firmware).toEqual({ kind: "skipped" });
  });

  it("runs again on the device that came back on another session", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [upToDate, upToDate],
    });

    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY", sessionId: "session-2" });
    await settle();

    expect(fake.firmwareCheckRuns()).toBe(2);
    await expectChecksPassed(actor);
  });

  // The new session can lock before SESSION_READY. Unlocking skips SESSION_READY, so the new
  // session must not keep the old session's firmware check.
  it("runs again when the new session locks before it is ready", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [upToDate, upToDate],
    });

    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_CHANGED", sessionId: "session-2" });
    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expect(fake.firmwareCheckRuns()).toBe(2);
    await expectChecksPassed(actor);
  });

  it("never hands the update it found to the device that replaced that one", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [updateAvailable, upToDate],
    });

    expect(stateOf(actor)).toBe("firmwareUpdateOffered");

    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY", sessionId: "session-2" });
    await settle();

    await expectChecksPassed(actor);
    expect(actor.getSnapshot().context.firmware).toEqual({ kind: "upToDate" });
  });
});

describe("the firmware handover", () => {
  it("waits without touching the device once the app takes over", async () => {
    const { actor, fake } = await start(handoverScript([os(unseeded)]));
    const reads = fake.sendCommand.mock.calls.length;
    const actions = fake.executeDeviceAction.mock.calls.length;

    actor.send({ type: "USER_ACCEPT" });
    await settle();

    expect(stateOf(actor)).toBe("firmwareUpdateDelegated");
    expect(fake.sendCommand).toHaveBeenCalledTimes(reads);
    expect(fake.executeDeviceAction).toHaveBeenCalledTimes(actions);
  });

  it("re-reads the device when the app's flow returns control", async () => {
    const { actor } = await start(handoverScript([os(unseeded), os({ isBootloader: true })]));

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId: "session" });

    expect(stateOf(actor)).toBe("readingState");
  });

  it("completes the checks when the device comes back updated", async () => {
    const { actor } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    await handOverAndReturn(actor);

    await expectChecksPassed(actor);
  });

  it("offers the update again when the device comes back unchanged", async () => {
    const { actor } = await start(handoverScript([os(unseeded)]));

    await handOverAndReturn(actor);

    expect(stateOf(actor)).toBe("firmwareUpdateOffered");
  });

  it("exits on resumeFirmwareUpdate when the device is left in bootloader", async () => {
    const { actor } = await start(handoverScript([os(unseeded), os({ isBootloader: true })]));

    await handOverAndReturn(actor);

    expect(exitOf(actor)).toMatchObject({ reason: "resumeFirmwareUpdate" });
  });

  it("carries the session read after the update rather than the initial one", async () => {
    const { actor } = await start(handoverScript([os(unseeded), os({ isBootloader: true })]));

    await handOverAfterReboot(actor);

    expect(exitOf(actor)).toMatchObject({ sessionId: "session-after-update" });
  });

  it("waits through the reboot that drops the transport, rather than leaving the handover", async () => {
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    const reads = fake.sendCommand.mock.calls.length;
    actor.send({ type: "TRANSPORT_LOST" });
    await settle();

    expect(stateOf(actor)).toBe("firmwareUpdateDelegated");

    actor.send({ type: "FIRMWARE_UPDATE_RECONNECT_REQUIRED" });
    await settle();

    expect(stateOf(actor)).toBe("awaitingSessionAfterFirmwareUpdate");
    expect(fake.sendCommand).toHaveBeenCalledTimes(reads);
    expect(actor.getSnapshot().context.sessionId).toBe("session");
    expect(actor.getSnapshot().context.genuineVerdict).toBeNull();

    actor.send({ type: "SESSION_READY", sessionId: "session-after-update" });
    await settle();

    await expectChecksPassed(actor);
  });

  it("cannot be left on the onboarding cross while the app is flashing the device", async () => {
    const { actor } = await start(handoverScript([os(unseeded)]));

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    actor.send({ type: "QUIT" });
    await settle();

    expect(stateOf(actor)).toBe("firmwareUpdateDelegated");
  });

  it("reports the device still seeded, without a verdict, when the read after an update fails", async () => {
    const seen: DeviceOnboardingContext[] = [];
    const { actor } = await start(
      handoverScript([os(seeded), { throws: new Error("transport failed") }]),
      {
        leaveOnboarding: (_reason, context) => seen.push(context),
      },
    );

    await handOverAndReturn(actor);
    await settleRetries();

    expect(exitOf(actor)).toMatchObject({ reason: "legacyFallback" });
    expect(seen.at(-1)).toEqual(
      expect.objectContaining({ isOnboarded: true, genuineVerdict: null }),
    );
  });

  it("runs the early check and the genuine check again after the update", async () => {
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    await handOverAfterReboot(actor);

    expect(fake.genuineCheckRuns()).toBe(2);
    expect(fake.earlyCheckToggles()).toEqual([
      EarlyCheckToggle.Enter,
      EarlyCheckToggle.Enter,
      EarlyCheckToggle.Exit,
    ]);
    await expectChecksPassed(actor);
  });

  it("repeats the genuine check when the rebooted session reuses the previous id", async () => {
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    await handOverAfterReboot(actor, "session");

    expect(fake.genuineCheckRuns()).toBe(2);
    await expectChecksPassed(actor);
  });

  it("shows the success screen again when an update reboots onto the same session", async () => {
    const { actor, fake } = await launch({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [upToDate, updateAvailable, upToDate],
    });

    actor.send({ type: "CONTINUE" });
    await settle();
    actor.send({ type: "CONTINUE" });
    await settle();
    expect(stateOf(actor)).toBe("waiting");

    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY", sessionId: "session" });
    await settle();
    expect(stateOf(actor)).toBe("firmwareUpdateOffered");

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    actor.send({ type: "FIRMWARE_UPDATE_RECONNECT_REQUIRED" });
    await settle();
    actor.send({ type: "SESSION_READY", sessionId: "session" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    expect(stateOf(actor)).toBe("checksSucceeded");
    actor.stop();
  });

  it("shows the success screen again when the update returns on the same session", async () => {
    const { actor, fake } = await launch({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [upToDate, updateAvailable, upToDate],
    });

    actor.send({ type: "CONTINUE" });
    await settle();
    actor.send({ type: "CONTINUE" });
    await settle();

    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY", sessionId: "session" });
    await settle();

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId: "session" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    expect(stateOf(actor)).toBe("checksSucceeded");
    actor.stop();
  });

  it("ignores a lock, a lost transport and a late close while it waits for the rebooted session", async () => {
    const { actor, fake } = await start(handoverScript([os(unseeded)]));

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    actor.send({ type: "FIRMWARE_UPDATE_RECONNECT_REQUIRED" });
    await settle();
    const reads = fake.sendCommand.mock.calls.length;

    actor.send({ type: "LOCKED" });
    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_CHANGED", sessionId: "session-late" });
    actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId: "session-late" });
    actor.send({ type: "FIRMWARE_UPDATE_RECONNECT_REQUIRED" });
    await settle();

    expect(stateOf(actor)).toBe("awaitingSessionAfterFirmwareUpdate");
    expect(actor.getSnapshot().context.sessionId).toBe("session");
    expect(fake.sendCommand).toHaveBeenCalledTimes(reads);
  });

  it("quits the post-update wait without talking to the dead session", async () => {
    const { actor, fake } = await start(handoverScript([os(unseeded)]));

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    actor.send({ type: "FIRMWARE_UPDATE_RECONNECT_REQUIRED" });
    await settle();
    const toggles = fake.earlyCheckToggles().length;

    actor.send({ type: "QUIT" });
    await settle();

    expect(exitOf(actor)).toMatchObject({ reason: "userQuit" });
    expect(fake.earlyCheckToggles()).toHaveLength(toggles);
  });

  it("never reaches the setup when the genuine check fails after the update", async () => {
    const { actor } = await start(
      handoverScript([os(unseeded)], { genuineCheck: [genuine, deviceRefusal] }),
    );

    await handOverAfterReboot(actor);
    actor.send({ type: "CLOSE" });
    await settle();

    expect(stateOf(actor)).toBe("checksIdle");
  });
});

describe("a nano firmware update held back until setup", () => {
  const readyAndSeeded = stepChanged(OnboardingStep.Ready, { isOnboarded: true });
  // Read twice: on entry, then by the first setup poll, which must not see the device ready yet.
  const unseededRead = os({ ...unseeded, seVersion: "2.3.0" });

  function expectWaitingInSetup(actor: OnboardingActor) {
    expect(actor.getSnapshot().matches({ deviceSetup: "waiting" })).toBe(true);
  }

  async function enterHeldBackSetup(
    script: Partial<OnboardingDmkScript> = {},
    {
      deviceModelId = DeviceModelId.NANO_X,
      seVersion = "2.3.0",
      leaveOnboarding,
    }: {
      deviceModelId?: DeviceModelId;
      seVersion?: string;
      leaveOnboarding?: (reason: string, context: DeviceOnboardingContext) => void;
    } = {},
  ) {
    return start(
      {
        osVersion: [os({ ...unseeded, seVersion })],
        genuineCheck: [genuine],
        firmwareCheck: [updateAvailable],
        ...script,
      },
      { deviceModelId, leaveOnboarding },
    );
  }

  it.each([
    [DeviceModelId.NANO_X, "2.2.0"],
    [DeviceModelId.NANO_X, "2.3.0"],
    [DeviceModelId.NANO_X, "2.7.0"],
    [DeviceModelId.NANO_SP, "1.1.0"],
    [DeviceModelId.NANO_SP, "1.6.0"],
  ])(
    "runs the genuine check of an unseeded %s on %s, then sets it up without a firmware offer",
    async (deviceModelId, seVersion) => {
      const { actor, fake } = await enterHeldBackSetup({}, { deviceModelId, seVersion });

      expect(fake.genuineCheckRuns()).toBe(1);
      expect(fake.firmwareCheckRuns()).toBe(0);
      expect(stateOf(actor)).toBe("waiting");
      expect(actor.getSnapshot().context).toMatchObject({
        firmware: { kind: "deferred" },
        updateAfterSetup: true,
      });
    },
  );

  it.each([
    [DeviceModelId.NANO_X, "2.7.1"],
    [DeviceModelId.NANO_SP, "1.6.1"],
  ])(
    "offers the update of an unseeded %s on %s before setting it up",
    async (deviceModelId, seVersion) => {
      const { actor } = await launch(
        {
          osVersion: [os({ ...unseeded, seVersion })],
          genuineCheck: [genuine],
          firmwareCheck: [updateAvailable],
        },
        { deviceModelId },
      );
      actor.send({ type: "CONTINUE" });
      await settle();

      expect(stateOf(actor)).toBe("firmwareUpdateOffered");
      expect(actor.getSnapshot().context.updateAfterSetup).toBe(false);
    },
  );

  it.each([
    [DeviceModelId.NANO_X, "2.3.0"],
    [DeviceModelId.NANO_X, "2.4.0"],
    [DeviceModelId.NANO_SP, "1.6.0"],
  ])("offers the update of a seeded %s on %s as today", async (deviceModelId, seVersion) => {
    const { actor } = await launch(
      {
        osVersion: [os({ ...seeded, seVersion })],
        genuineCheck: [genuine],
        firmwareCheck: [updateAvailable],
      },
      { deviceModelId },
    );
    actor.send({ type: "CONTINUE" });
    await settle();

    expect(stateOf(actor)).toBe("firmwareUpdateOffered");
  });

  it("checks the firmware once the device is seeded, and offers the update", async () => {
    const { actor, fake } = await enterHeldBackSetup();

    actor.send(readyAndSeeded);
    await settle();

    expect(fake.firmwareCheckRuns()).toBe(1);
    expect(actor.getSnapshot().matches({ postSetupFirmware: "firmwareUpdateOffered" })).toBe(true);
    expect(actor.getSnapshot().status).not.toBe("done");
  });

  it("ends the setup when the seeded device is already up to date", async () => {
    const { actor } = await enterHeldBackSetup({ firmwareCheck: [upToDate] });

    actor.send(readyAndSeeded);
    await settle();

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(actor.getSnapshot().context.updateAfterSetup).toBe(false);
  });

  it("ends the setup when the user declines the update", async () => {
    const { actor } = await enterHeldBackSetup();
    actor.send(readyAndSeeded);
    await settle();

    actor.send({ type: "USER_DECLINE" });
    await settle();

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
  });

  it.each(["SKIP", "CLOSE"] as const)(
    "ends the setup on %s when the firmware check fails",
    async type => {
      const { actor } = await enterHeldBackSetup({ firmwareCheck: [checkFailure] });
      actor.send(readyAndSeeded);
      await settle();
      expect(actor.getSnapshot().matches({ postSetupFirmware: "firmwareCheckFailed" })).toBe(true);

      actor.send({ type });
      await settle();

      expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    },
  );

  it("runs the firmware check again on a retry", async () => {
    const { actor, fake } = await enterHeldBackSetup({
      firmwareCheck: [checkFailure, updateAvailable],
    });
    actor.send(readyAndSeeded);
    await settle();

    actor.send({ type: "RETRY" });
    await settle();

    expect(fake.firmwareCheckRuns()).toBe(2);
    expect(actor.getSnapshot().matches({ postSetupFirmware: "firmwareUpdateOffered" })).toBe(true);
  });

  it("re-attests a session that changed during setup, then offers the held-back update", async () => {
    const { actor, fake } = await enterHeldBackSetup({
      osVersion: [unseededRead, unseededRead, os({ ...seeded, seVersion: "2.3.0" })],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [updateAvailable],
    });

    expectWaitingInSetup(actor);
    actor.send({ type: "SESSION_CHANGED", sessionId: "session-2" });
    await settle();
    actor.send(readyAndSeeded);
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    expect(actor.getSnapshot().matches({ checks: "firmwareUpdateOffered" })).toBe(true);
    expect(actor.getSnapshot().context.updateAfterSetup).toBe(true);
  });

  it("does not offer the update twice once the re-attested session answered it", async () => {
    const { actor } = await enterHeldBackSetup({
      osVersion: [unseededRead, unseededRead, os({ ...seeded, seVersion: "2.3.0" })],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [updateAvailable],
    });
    expectWaitingInSetup(actor);
    actor.send({ type: "SESSION_CHANGED", sessionId: "session-2" });
    await settle();
    actor.send(readyAndSeeded);
    await settle();

    actor.send({ type: "USER_DECLINE" });
    await settle();
    await leaveSuccessScreen(actor);
    actor.send(readyAndSeeded);
    await settle();

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
  });

  it("re-attests the device when the session changes during the post-setup firmware check", async () => {
    const { actor, fake } = await enterHeldBackSetup({
      osVersion: [unseededRead, unseededRead, os({ ...seeded, seVersion: "2.3.0" })],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [updateAvailable, upToDate],
    });
    expectWaitingInSetup(actor);
    actor.send(readyAndSeeded);
    await settle();
    expect(actor.getSnapshot().matches({ postSetupFirmware: "firmwareUpdateOffered" })).toBe(true);

    actor.send({ type: "SESSION_CHANGED", sessionId: "session-2" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    expect(actor.getSnapshot().context.sessionId).toBe("session-2");
    expect(actor.getSnapshot().matches("postSetupFirmware")).toBe(false);
  });

  it("marks the device seeded before checking its firmware after setup", async () => {
    const { actor } = await enterHeldBackSetup();

    actor.send(readyAndSeeded);
    await settle();

    expect(actor.getSnapshot().context).toMatchObject({
      isOnboarded: true,
      onboardedOnEntry: false,
    });
  });

  it("leaves as a seeded device when it cannot be read after the post-setup update", async () => {
    const leaveOnboarding = jest.fn();
    const { actor } = await enterHeldBackSetup(
      {
        osVersion: [unseededRead, unseededRead, { throws: new Error("transport failed") }],
      },
      { leaveOnboarding },
    );
    expectWaitingInSetup(actor);
    actor.send(readyAndSeeded);
    await settle();
    actor.send({ type: "USER_ACCEPT" });
    await settle();

    actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId: "session-after-update" });
    await settleRetries();

    expect(exitOf(actor)).toMatchObject({ reason: "legacyFallback" });
    expect(leaveOnboarding).toHaveBeenCalledWith(
      "legacyFallback",
      expect.objectContaining({ isOnboarded: true }),
    );
  });

  it("re-attests the device after the update, then ends the setup without offering it again", async () => {
    const { actor, fake } = await enterHeldBackSetup({
      osVersion: [os({ ...unseeded, seVersion: "2.3.0" }), os({ ...seeded, seVersion: "2.8.0" })],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [updateAvailable, upToDate],
    });
    actor.send(readyAndSeeded);
    await settle();

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    expect(actor.getSnapshot().context.updateAfterSetup).toBe(false);

    actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId: "session-after-update" });
    await settle();
    await leaveSuccessScreen(actor);
    actor.send(readyAndSeeded);
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
  });
});
