import { DeviceModelId, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import { EarlyCheckToggle } from "./device/toggleEarlyCheckCommand";
import { settle } from "./tests/actorHarness";
import {
  deviceRefusal,
  exitOf,
  expectChecksPassed,
  genuine,
  handOverAndReturn,
  handoverScript,
  launch,
  lockedDevice,
  os,
  passingChecks,
  reach,
  scriptReaching,
  seeded,
  settleRetries,
  start,
  stateOf,
  unseeded,
  upToDate,
  updateAvailable,
} from "./tests/machineHarness";

describe("routing", () => {
  it("runs the checks of an unseeded touchscreen under the on-device waiting screen", async () => {
    const { actor, fake } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    await expectChecksPassed(actor);
    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
  });

  it("never shows the on-device screen to a nano, which has none", async () => {
    const { actor, fake } = await start(
      { osVersion: [os({ ...unseeded, seVersion: "2.4.0" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_X },
    );

    await expectChecksPassed(actor);
    expect(fake.earlyCheckToggles()).toEqual([]);
  });

  it("never shows the on-device screen to a seeded device, whose firmware refuses the APDU", async () => {
    const { actor, fake } = await start({ osVersion: [os(seeded)], ...passingChecks });

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(actor.getSnapshot().context.seedPath).toBeNull();
    expect(fake.earlyCheckToggles()).toEqual([]);
  });

  it("checks a device whose onboarding step it cannot parse, which is every device today", async () => {
    const { actor } = await start({ osVersion: [os({})], ...passingChecks });

    await expectChecksPassed(actor);
  });

  it("drives a nano x seeded long ago on an old firmware", async () => {
    const { actor, fake } = await start(
      { osVersion: [os({ ...seeded, seVersion: "0.9.0" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_X },
    );

    expect(fake.genuineCheckRuns()).toBe(1);
    expect(stateOf(actor)).toBe("done");
  });

  it.each([
    ["an unseeded nano x below 2.2.0", DeviceModelId.NANO_X, "2.1.9"],
    ["an unseeded nano s plus below 1.1.0", DeviceModelId.NANO_SP, "1.0.9"],
  ])("sends %s to legacy before any check", async (_case, deviceModelId, seVersion) => {
    const { actor, fake } = await launch(
      { osVersion: [os({ ...unseeded, seVersion })], ...passingChecks },
      { deviceModelId },
    );

    expect(exitOf(actor)).toMatchObject({ reason: "legacyFallback" });
    expect(fake.genuineCheckRuns()).toBe(0);
  });

  it.each([
    ["unseeded", unseeded],
    ["seeded", seeded],
  ])("sends a %s nano s to legacy whatever firmware it runs", async (_case, state) => {
    const { actor, fake } = await launch(
      { osVersion: [os({ ...state, seVersion: "1.6.1" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_S },
    );

    expect(exitOf(actor)).toMatchObject({ reason: "legacyFallback" });
    expect(fake.genuineCheckRuns()).toBe(0);
  });

  it("drives a touchscreen whatever firmware it runs", async () => {
    const { actor } = await start({
      osVersion: [os({ ...unseeded, seVersion: "0.9.0" })],
      ...passingChecks,
    });

    await expectChecksPassed(actor);
  });

  it.each([
    ["in bootloader", { isBootloader: true }],
    ["running an OS updater", { isOsu: true }],
  ])("exits on resumeFirmwareUpdate when it finds a device %s", async (_case, state) => {
    const { actor } = await start({ osVersion: [os(state)] });

    expect(exitOf(actor)).toMatchObject({ reason: "resumeFirmwareUpdate" });
  });

  it("falls back to legacy when the device cannot be read at all", async () => {
    const { actor } = await start({ osVersion: [{ throws: new Error("transport failed") }] });

    await settleRetries();

    expect(exitOf(actor)).toMatchObject({ reason: "legacyFallback" });
  });

  it.each([
    ["the host says nothing", { omitHostsSeedSetup: true }],
    ["the host cannot set the seed up", { hostsSeedSetup: false }],
  ] as const)(
    "sends an unseeded device to legacy before any check when %s",
    async (_case, overrides) => {
      const { actor, fake } = await launch(
        { osVersion: [os(unseeded)], ...passingChecks },
        overrides,
      );

      expect(exitOf(actor)).toMatchObject({ reason: "legacyFallback" });
      expect(fake.genuineCheckRuns()).toBe(0);
      expect(fake.earlyCheckToggles()).toEqual([]);
    },
  );

  it("keeps a seeded device on the checks when the host cannot set the seed up", async () => {
    const { actor, fake } = await start(
      { osVersion: [os(seeded)], ...passingChecks },
      { hostsSeedSetup: false },
    );

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(fake.earlyCheckToggles()).toEqual([]);
  });
});

describe("entering the flow", () => {
  it("reads the device, then waits for the user before it touches it again", async () => {
    const { actor, fake } = await launch({ osVersion: [os(unseeded)], ...passingChecks });

    expect(stateOf(actor)).toBe("awaitingStart");
    expect(actor.getSnapshot().context.firmwareVersion).not.toBeNull();
    expect(fake.genuineCheckRuns()).toBe(0);
    expect(fake.earlyCheckToggles()).toEqual([]);
  });

  it("runs the checks and waits on the success screen once the user starts", async () => {
    const { actor, fake } = await launch({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(1);
    expect(stateOf(actor)).toBe("checksSucceeded");
    actor.stop();
  });

  it("should open the unlock wait when the device is locked as the checks start", async () => {
    const { actor } = await launch({
      osVersion: [os(unseeded), lockedDevice],
      genuineCheck: [{ prompts: UserInteractionRequired.UnlockDevice }],
    });

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(stateOf(actor)).toBe("deviceLocked");
  });

  it("asks again when the device was locked before the user started", async () => {
    const { actor } = await launch({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expect(stateOf(actor)).toBe("awaitingStart");
  });

  it("asks once, and not again when the device is re-read after an update", async () => {
    const { actor } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    await handOverAndReturn(actor);

    await expectChecksPassed(actor);
    actor.stop();
  });

  it("waits for the user to start the oldest unseeded nano x it drives", async () => {
    const { actor } = await launch(
      { osVersion: [os({ ...unseeded, seVersion: "2.2.0" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_X },
    );

    expect(stateOf(actor)).toBe("awaitingStart");
  });

  it("leaves the flow on the onboarding cross before the user has started", async () => {
    const { actor } = await launch({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "QUIT" });
    await settle();

    expect(exitOf(actor)).toMatchObject({ reason: "userQuit" });
  });
});

describe("global handlers", () => {
  it("waits for a locked device to be unlocked, rather than falling back", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "LOCKED" });

    expect(stateOf(actor)).toBe("deviceLocked");
  });

  it("keeps waiting while the locked device turns the polling away", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded), lockedDevice],
      ...passingChecks,
    });

    actor.send({ type: "LOCKED" });
    await settle();

    expect(stateOf(actor)).toBe("deviceLocked");
  });

  it("resumes on its own once the device answers again, with no event from the host", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "LOCKED" });
    await settle();

    expect(stateOf(actor)).toBe("waiting");
  });

  it("re-reads the device once it is unlocked", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expect(stateOf(actor)).toBe("waiting");
  });

  it("waits for a new session when the transport is lost", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "TRANSPORT_LOST" });

    expect(stateOf(actor)).toBe("awaitingSession");
  });

  it("re-reads the device on the session the app reopened", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY", sessionId: "session" });
    await settle();

    expect(stateOf(actor)).toBe("waiting");
  });

  it("starts over on a new session, rather than holding a failure the user dismissed", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [deviceRefusal, genuine],
      firmwareCheck: [upToDate],
    });

    actor.send({ type: "CLOSE" });
    await settle();
    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY", sessionId: "session-2" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    expect(actor.getSnapshot().context.lastGenuineFailure).toBeNull();
    expect(stateOf(actor)).toBe("checksSucceeded");
    await expectChecksPassed(actor);
  });

  it.each(["checksIdle", "genuineFailed", "firmwareUpdateOffered", "waiting", "deviceLocked"])(
    "leaves the flow on the onboarding cross from %s",
    async state => {
      const { actor } = await start(scriptReaching(state));

      await reach(actor, state);
      actor.send({ type: "QUIT" });
      await settle();

      expect(exitOf(actor)).toMatchObject({ reason: "userQuit" });
    },
  );

  it("hands the device over rather than ending it", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "QUIT" });

    expect(exitOf(actor)).toEqual({
      sessionId: "session",
      device: { id: "device", modelId: DeviceModelId.FLEX },
      reason: "userQuit",
    });
  });
});
