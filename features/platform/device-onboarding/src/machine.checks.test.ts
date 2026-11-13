import { EarlyCheckToggle } from "./device/toggleEarlyCheckCommand";
import { settle } from "./tests/actorHarness";
import {
  awaitsApproval,
  checkFailure,
  deviceRefusal,
  exitOf,
  expectChecksPassed,
  genuine,
  launch,
  lockedDevice,
  notGenuine,
  os,
  passingChecks,
  refusedToggle,
  secureConnectionPrompt,
  seeded,
  start,
  stateOf,
  unseeded,
  upToDate,
  updateAvailable,
} from "./tests/machineHarness";

describe("the on-device waiting screen", () => {
  it("runs the checks anyway when the device has already left the welcome step", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      earlyCheck: [refusedToggle("6982")],
      ...passingChecks,
    });

    expect(fake.genuineCheckRuns()).toBe(1);
    await expectChecksPassed(actor);
  });

  it("still tries to leave a screen the device refused to enter", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      earlyCheck: [refusedToggle("6982")],
      ...passingChecks,
    });

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
    await expectChecksPassed(actor);
  });

  it("is dismissed as soon as the checks pass, rather than when the user taps", async () => {
    const { actor, fake } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    expect(fake.earlyCheckToggles()).toContain(EarlyCheckToggle.Exit);
    await expectChecksPassed(actor);
  });

  it("is not dismissed twice when the device locks after the checks passed", async () => {
    const { actor, fake } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
  });

  it("is still dismissed when the device locked halfway through the checks", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [updateAvailable],
    });

    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();
    actor.send({ type: "USER_DECLINE" });
    await settle();

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
    await expectChecksPassed(actor);
  });

  it("is not shown again to a device that comes back with its checks paused", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [deviceRefusal],
    });

    actor.send({ type: "CLOSE" });
    await settle();
    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter]);
    expect(stateOf(actor)).toBe("checksIdle");
  });

  it("lets the host leave once when the user quits", async () => {
    const left: string[] = [];
    const { actor } = await start(
      { osVersion: [os(unseeded)], genuineCheck: [deviceRefusal] },
      { leaveOnboarding: reason => left.push(reason) },
    );

    actor.send({ type: "QUIT" });
    await settle();

    expect(left).toEqual(["userQuit"]);
  });

  it("is dismissed when the user leaves on the onboarding cross", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [deviceRefusal],
    });

    actor.send({ type: "QUIT" });
    await settle();

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
    expect(exitOf(actor)).toMatchObject({ reason: "userQuit" });
  });

  it("is dismissed on quit while it is still being entered", async () => {
    const { actor, fake } = await launch({ osVersion: [os(unseeded)] });

    actor.send({ type: "CONTINUE" });
    actor.send({ type: "QUIT" });
    await settle();

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
    expect(exitOf(actor)).toMatchObject({ reason: "userQuit" });
  });

  it("is shown again to a device that relocked before its checks were done", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [deviceRefusal, genuine],
      firmwareCheck: [upToDate],
    });

    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expect(fake.earlyCheckToggles()).toEqual([
      EarlyCheckToggle.Enter,
      EarlyCheckToggle.Enter,
      EarlyCheckToggle.Exit,
    ]);
    await expectChecksPassed(actor);
  });
});

describe("the genuine check", () => {
  it.each([
    ["a refusal on the device", deviceRefusal, "GENUINE_CHECK_REFUSED"],
    [
      "a lost secure channel",
      { fails: { _tag: "WebSocketConnectionError" } },
      "SECURE_CHANNEL_LOST",
    ],
    ["an unreachable backend", checkFailure, "GENUINE_CHECK_FAILED"],
  ])("puts %s on the context for the app to map to a drawer", async (_, failure, kind) => {
    const { actor } = await start({ osVersion: [os(unseeded)], genuineCheck: [failure] });

    expect(stateOf(actor)).toBe("genuineFailed");
    expect(actor.getSnapshot().context.lastGenuineFailure).toEqual({
      kind,
      failure: (failure as { fails: unknown }).fails,
    });
  });

  it("sends a device that is not genuine to the support screen", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], genuineCheck: [notGenuine] });

    expect(stateOf(actor)).toBe("notGenuineSupport");
    expect(actor.getSnapshot().context.lastGenuineFailure).toMatchObject({
      kind: "DEVICE_NOT_GENUINE",
    });
  });

  it("returns to the genuine check when the support sheet is closed", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [notGenuine, genuine],
      firmwareCheck: [upToDate],
    });

    actor.send({ type: "CLOSE" });
    await settle();

    expect(stateOf(actor)).toBe("checksIdle");
    expect(actor.getSnapshot().context.checksPaused).toBe(true);
    expect(fake.genuineCheckRuns()).toBe(1);
  });

  it("holds a counterfeit device on the support screen across a lock it triggered itself", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [notGenuine, genuine],
      firmwareCheck: [upToDate],
    });

    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expect(stateOf(actor)).toBe("notGenuineSupport");
    expect(fake.genuineCheckRuns()).toBe(1);
  });

  it("re-attests a device that came back on another session rather than trusting the verdict", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [upToDate],
    });

    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY", sessionId: "session-2" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    await expectChecksPassed(actor);
  });

  it("keeps the verdict across a lock, since the session is the same", async () => {
    const { actor, fake } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(1);
    await expectChecksPassed(actor);
  });

  it("carries the device's request to allow a secure connection to the app", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [secureConnectionPrompt],
    });

    expect(awaitsApproval(actor)).toBe(true);
    expect(stateOf(actor)).toBe("genuineCheck");
  });

  it("clears that request when the prompt goes away", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [secureConnectionPrompt],
    });

    actor.send({ type: "SECURE_CONNECTION_ALLOWED" });
    await settle();

    expect(awaitsApproval(actor)).toBe(false);
    expect(stateOf(actor)).toBe("genuineCheck");
  });

  it.each(["LOCKED", "TRANSPORT_LOST", "QUIT"] as const)(
    "takes that request back on %s, which leaves the check with no one to answer it",
    async type => {
      const { actor } = await start({
        osVersion: [os(unseeded), lockedDevice],
        genuineCheck: [secureConnectionPrompt],
      });

      actor.send({ type });
      await settle();

      expect(awaitsApproval(actor)).toBe(false);
    },
  );

  it("runs again on a retry, and clears the failure it is retrying", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [deviceRefusal, genuine],
      firmwareCheck: [upToDate],
    });

    actor.send({ type: "RETRY" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    expect(actor.getSnapshot().context.lastGenuineFailure).toBeNull();
    await expectChecksPassed(actor);
  });

  it("is mandatory: the checks never complete without it", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], genuineCheck: [deviceRefusal] });

    actor.send({ type: "CLOSE" });
    await settle();

    expect(stateOf(actor)).toBe("checksIdle");
    expect(actor.getSnapshot().context.genuineVerdict).toBeNull();
  });
});

describe("drawers", () => {
  it("returns to the state underneath rather than leaving the flow", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], genuineCheck: [deviceRefusal] });

    actor.send({ type: "CLOSE" });
    await settle();

    expect(stateOf(actor)).toBe("checksIdle");
  });

  it("does not restart the check the user just dismissed", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [deviceRefusal],
    });

    actor.send({ type: "CLOSE" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(1);
  });

  it("restarts it when the user asks from the step screen", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [deviceRefusal, genuine],
      firmwareCheck: [upToDate],
    });

    actor.send({ type: "CLOSE" });
    await settle();
    actor.send({ type: "RETRY" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    await expectChecksPassed(actor);
  });
});

describe("the end of the checks", () => {
  it("waits on the success screen until the user continues into setup", async () => {
    const { actor } = await launch({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(stateOf(actor)).toBe("checksSucceeded");
    expect(actor.getSnapshot().status).not.toBe("done");

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(stateOf(actor)).toBe("waiting");
    actor.stop();
  });

  it("has dismissed the on-device screen before it shows the success screen", async () => {
    const { actor, fake } = await launch({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(stateOf(actor)).toBe("checksSucceeded");
    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
    actor.stop();
  });

  it("offers Ledger Sync only after the user leaves the success screen", async () => {
    const { actor } = await launch(
      { osVersion: [os(seeded)], ...passingChecks },
      { offerSync: true },
    );

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(stateOf(actor)).toBe("checksSucceeded");
    expect(actor.getSnapshot().status).not.toBe("done");

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(exitOf(actor)).toMatchObject({ reason: "offerLedgerSync" });
  });

  it("ends an already onboarded device without the offer once the user continues", async () => {
    const { actor } = await launch({ osVersion: [os(seeded)], ...passingChecks });

    actor.send({ type: "CONTINUE" });
    await settle();
    expect(stateOf(actor)).toBe("checksSucceeded");

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
  });

  it("leaves the flow from the success screen", async () => {
    const { actor } = await launch({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "CONTINUE" });
    await settle();
    actor.send({ type: "QUIT" });
    await settle();

    expect(exitOf(actor)).toMatchObject({ reason: "userQuit" });
  });

  it("runs the checks again when the session changes on the success screen", async () => {
    const { actor, fake } = await launch({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine, genuine],
      firmwareCheck: [upToDate, upToDate],
    });

    actor.send({ type: "CONTINUE" });
    await settle();
    expect(stateOf(actor)).toBe("checksSucceeded");

    actor.send({ type: "SESSION_CHANGED", sessionId: "session-2" });
    await settle();

    expect(actor.getSnapshot().context.sessionId).toBe("session-2");
    expect(fake.genuineCheckRuns()).toBe(2);
    expect(stateOf(actor)).toBe("checksSucceeded");
    expect(actor.getSnapshot().status).not.toBe("done");

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(stateOf(actor)).toBe("waiting");
    actor.stop();
  });
});
