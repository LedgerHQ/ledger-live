import {
  CommandResultFactory,
  DeviceModelId,
  UnknownDAError,
  UserInteractionRequired,
  type GenuineCheckDAOutput,
  type GetDeviceMetadataDAOutput,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import { createActor, type Actor } from "xstate";
import {
  EarlyCheckToggle,
  ToggleEarlyCheckCommandError,
  type ToggleEarlyCheckErrorCode,
} from "./device/toggleEarlyCheckCommand";
import { deviceOnboardingMachine } from "./machine";
import { minimumNanoVersions } from "./rules";
import { settle } from "./tests/actorHarness";
import {
  createFakeOnboardingDmk,
  type FakeOnboardingDmk,
  type OnboardingDmkScript,
  type ScriptedCommand,
} from "./tests/fakeDmk";
import { createOsVersionResponse, type OsVersionResponseOptions } from "./tests/osVersionResponse";
import {
  OnboardingStep,
  RecoveryKeyStatus,
  type AvailableFirmwareUpdate,
  type DeviceOnboardingState,
} from "./types";

const unseeded: OsVersionResponseOptions = {
  onboardingState: "welcome-screen-1",
  numberOfWords: 24,
  currentWordIndex: 0,
};

const seeded: OsVersionResponseOptions = {
  onboardingState: "device-is-ready",
  numberOfWords: 24,
  currentWordIndex: 0,
  isOnboarded: true,
};

const availableUpdate = {
  finalFirmware: { version: "1.5.0" },
} as unknown as AvailableFirmwareUpdate;

const genuine = { completes: { isGenuine: true } as GenuineCheckDAOutput };
const notGenuine = { completes: { isGenuine: false } as GenuineCheckDAOutput };
const upToDate = { completes: metadata(undefined) };
const updateAvailable = { completes: metadata(availableUpdate) };

const lockedDevice: ScriptedCommand<GetOsVersionResponse> = { throws: new Error("locked") };

const started: OnboardingActor[] = [];

afterEach(() => {
  while (started.length > 0) {
    started.pop()?.stop();
  }
});

const deviceRefusal = { fails: { _tag: "RefusedByUserDAError" } };
const checkFailure = { fails: new UnknownDAError() };
const secureConnectionPrompt = { prompts: UserInteractionRequired.AllowSecureConnection };

const passingChecks: OnboardingDmkScript = { genuineCheck: [genuine], firmwareCheck: [upToDate] };

describe("routing", () => {
  it("runs the checks of an unseeded touchscreen under the on-device waiting screen", async () => {
    const { actor, fake } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    expectChecksPassed(actor);
    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
  });

  it("never shows the on-device screen to a nano, which has none", async () => {
    const { actor, fake } = await start(
      { osVersion: [os({ ...unseeded, seVersion: "2.4.0" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_X },
    );

    expectChecksPassed(actor);
    expect(fake.earlyCheckToggles()).toEqual([]);
  });

  it("never shows the on-device screen to a seeded device, whose firmware refuses the APDU", async () => {
    const { actor, fake } = await start({ osVersion: [os(seeded)], ...passingChecks });

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
    expect(fake.earlyCheckToggles()).toEqual([]);
  });

  it("checks a device whose onboarding step it cannot parse, which is every device today", async () => {
    const { actor } = await start({ osVersion: [os({})], ...passingChecks });

    expectChecksPassed(actor);
  });

  it.each([
    ["unseeded", unseeded],
    ["seeded long ago", seeded],
  ])(
    "sends a nano %s on an old firmware to legacy, before anything is done to it",
    async (_case, state) => {
      const { actor, fake } = await launch(
        { osVersion: [os({ ...state, seVersion: "0.9.0" })], ...passingChecks },
        { deviceModelId: DeviceModelId.NANO_X },
      );

      expect(exitOf(actor)).toMatchObject({ reason: "legacyFallback" });
      expect(fake.genuineCheckRuns()).toBe(0);
    },
  );

  it("drives a nano s whatever firmware it runs, since it holds no floor", async () => {
    const { actor, fake } = await start(
      { osVersion: [os({ ...unseeded, seVersion: "1.6.1" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_S },
    );

    expectChecksPassed(actor);
    expect(fake.genuineCheckRuns()).toBe(1);
  });

  it("keeps a nano sitting exactly on its model floor", async () => {
    const { actor } = await start(
      {
        osVersion: [os({ ...unseeded, seVersion: minimumNanoVersions.get(DeviceModelId.NANO_X) })],
        ...passingChecks,
      },
      { deviceModelId: DeviceModelId.NANO_X },
    );

    expectChecksPassed(actor);
  });

  it("drives a touchscreen whatever firmware it runs, since only the nanos have a floor", async () => {
    const { actor } = await start({
      osVersion: [os({ ...unseeded, seVersion: "0.9.0" })],
      ...passingChecks,
    });

    expectChecksPassed(actor);
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
});

describe("the on-device waiting screen", () => {
  it("runs the checks anyway when the device has already left the welcome step", async () => {
    const { actor, fake } = await start({
      osVersion: [os(unseeded)],
      earlyCheck: [refusedToggle("6982")],
      ...passingChecks,
    });

    expect(fake.genuineCheckRuns()).toBe(1);
    expectChecksPassed(actor);
  });

  it("skips leaving a screen it never entered", async () => {
    const { fake } = await start({
      osVersion: [os(unseeded)],
      earlyCheck: [refusedToggle("6982")],
      ...passingChecks,
    });

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter]);
  });

  it("is dismissed as soon as the checks pass, rather than when the user taps", async () => {
    const { actor, fake } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    expect(fake.earlyCheckToggles()).toContain(EarlyCheckToggle.Exit);
    expectChecksPassed(actor);
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
    expectChecksPassed(actor);
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
    expectChecksPassed(actor);
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
    expectChecksPassed(actor);
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
    expectChecksPassed(actor);
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
    expectChecksPassed(actor);
  });
});

describe("the firmware check", () => {
  it("offers an available update", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [updateAvailable],
    });

    expect(stateOf(actor)).toBe("firmwareUpdateOffered");
    expect(actor.getSnapshot().context.availableFirmwareUpdate).toBe(availableUpdate);
  });

  it("carries on when the user declines it, and forgets it", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [updateAvailable],
    });

    actor.send({ type: "USER_DECLINE" });
    await settle();

    expectChecksPassed(actor);
    expect(actor.getSnapshot().context.availableFirmwareUpdate).toBeNull();
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
    expect(actor.getSnapshot().context.availableFirmwareUpdate).toBe(availableUpdate);
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

    expectChecksPassed(actor);
  });

  it("lets the user skip a check it could not complete", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [checkFailure],
    });

    actor.send({ type: "SKIP" });
    await settle();

    expectChecksPassed(actor);
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
    expectChecksPassed(actor);
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

    expectChecksPassed(actor);
    expect(actor.getSnapshot().context.availableFirmwareUpdate).toBeNull();
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

    expectChecksPassed(actor);
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

    await handOverAndReturn(actor, "session-after-update");

    expect(exitOf(actor)).toMatchObject({ sessionId: "session-after-update" });
  });

  it("waits through the reboot that drops the transport, rather than leaving the handover", async () => {
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    actor.send({ type: "TRANSPORT_LOST" });
    await settle();

    expect(stateOf(actor)).toBe("firmwareUpdateDelegated");

    actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId: "session-after-update" });
    await settle();

    expectChecksPassed(actor);
    expect(fake.genuineCheckRuns()).toBe(1);
  });

  it("cannot be left on the onboarding cross while the app is flashing the device", async () => {
    const { actor } = await start(handoverScript([os(unseeded)]));

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    actor.send({ type: "QUIT" });
    await settle();

    expect(stateOf(actor)).toBe("firmwareUpdateDelegated");
  });

  it("keeps the attestation across the reboot of the update it ran itself", async () => {
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], {
        genuineCheck: [genuine, genuine],
        firmwareCheck: [updateAvailable, upToDate],
      }),
    );

    await handOverAndReturn(actor, "session-after-update");

    expect(fake.genuineCheckRuns()).toBe(1);
    expectChecksPassed(actor);
  });

  it("dismisses the on-device screen a cancelled update left up", async () => {
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    await handOverAndReturn(actor);

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
    expectChecksPassed(actor);
  });

  it("does not check a device twice for being genuine on the session it already attested", async () => {
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    await handOverAndReturn(actor);

    expect(fake.genuineCheckRuns()).toBe(1);
    expectChecksPassed(actor);
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

  it("runs the checks through to the setup once the user starts", async () => {
    const { actor, fake } = await launch({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(1);
    expectChecksPassed(actor);
    actor.stop();
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

    expectChecksPassed(actor);
    actor.stop();
  });

  it("sends a device it cannot drive to legacy without asking the user anything", async () => {
    const { actor } = await launch(
      { osVersion: [os({ ...unseeded, seVersion: "0.9.0" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_X },
    );

    expect(exitOf(actor)).toMatchObject({ reason: "legacyFallback" });
  });

  it("leaves the flow on the onboarding cross before the user has started", async () => {
    const { actor } = await launch({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "QUIT" });
    await settle();

    expect(exitOf(actor)).toMatchObject({ reason: "userQuit" });
  });
});

describe("the end of the checks", () => {
  it("asks nothing of the user and sends a device still to be set up to the setup phase", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    await settle();

    expect(stateOf(actor)).toBe("waiting");
    actor.stop();
  });

  it("has dismissed the on-device screen by the time the setup phase starts", async () => {
    const { actor, fake } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
    expect(stateOf(actor)).toBe("waiting");
    actor.stop();
  });

  it("offers Ledger Sync to a device that was already onboarded on entry", async () => {
    const { actor } = await start(
      { osVersion: [os(seeded)], ...passingChecks },
      { offerSync: true },
    );

    expect(exitOf(actor)).toMatchObject({ reason: "offerLedgerSync" });
  });

  it("ends an already onboarded device without the offer when sync is not on the table", async () => {
    const { actor } = await start({ osVersion: [os(seeded)], ...passingChecks });

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
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

    expectChecksPassed(actor);
  });

  it("re-reads the device once it is unlocked", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expectChecksPassed(actor);
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

    expectChecksPassed(actor);
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
    expectChecksPassed(actor);
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
  });

  it.each([RecoveryKeyStatus.Choice, RecoveryKeyStatus.Running, RecoveryKeyStatus.Naming])(
    "sends an already onboarded device to the success exit while its Recovery Key flag is %s",
    async recoveryKeyStatus => {
      const { actor } = await start(
        {
          osVersion: [os({ ...seeded, recoveryKeyStatus })],
          ...passingChecks,
        },
        { offerSync: true },
      );

      expect(exitOf(actor)).toMatchObject({ reason: "offerLedgerSync" });
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

  it("follows a new seed on a touchscreen, then exits without offering Ledger Sync", async () => {
    const { actor } = await enterSetup({ offerSync: true });

    await follow(actor, [
      OnboardingStep.ChooseName,
      OnboardingStep.Pin,
      OnboardingStep.SetupChoice,
      OnboardingStep.NewDevice,
      OnboardingStep.NewDeviceConfirming,
    ]);

    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
  });

  it("skips naming on a nano and still reaches done", async () => {
    const { actor } = await enterSetup({ deviceModelId: DeviceModelId.NANO_X });

    await follow(actor, [OnboardingStep.Pin, OnboardingStep.SetupChoice, OnboardingStep.NewDevice]);
    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
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
  });

  it("returns to routing when the device goes back to welcome after setup has started", async () => {
    const { actor } = await enterSetup();

    actor.send(stepChanged(OnboardingStep.Pin));
    actor.send(stepChanged(OnboardingStep.WelcomeScreen1));
    await settle();

    expectChecksPassed(actor);
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

  it("never offers Ledger Sync to a device that was just seeded", async () => {
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
    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toEqual({
      sessionId: "session-2",
      device: { id: "device", modelId: DeviceModelId.FLEX },
      reason: "completed",
    });
  });

  it("reports its session on the Ledger Sync exit too", async () => {
    const { actor } = await launch(
      { osVersion: [os(seeded)], ...passingChecks },
      { offerSync: true },
    );

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(exitOf(actor)).toEqual({
      sessionId: "session",
      device: { id: "device", modelId: DeviceModelId.FLEX },
      reason: "offerLedgerSync",
    });
  });

  it("polls the device for the whole setup phase and stops once it has exited", async () => {
    const { actor, fake } = await launch(
      { osVersion: [os({ ...unseeded, seVersion: "2.4.0" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_X },
    );
    const commandsBeforeSetup = fake.sendCommand.mock.calls.length;

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

type OnboardingActor = Actor<typeof deviceOnboardingMachine>;

async function launch(
  script: OnboardingDmkScript,
  overrides: Partial<{
    deviceModelId: DeviceModelId;
    offerSync: boolean;
    leaveOnboarding: (reason: string) => void;
  }> = {},
): Promise<{ actor: OnboardingActor; fake: FakeOnboardingDmk }> {
  const fake = createFakeOnboardingDmk(script);
  const leave = overrides.leaveOnboarding;
  const machine = leave
    ? deviceOnboardingMachine.provide({
        actions: { leaveOnboarding: (_, params) => leave(params.reason) },
      })
    : deviceOnboardingMachine;

  const actor = createActor(machine, {
    input: {
      dmk: fake.dmk,
      sessionId: "session",
      deviceId: "device",
      deviceModelId: overrides.deviceModelId ?? DeviceModelId.FLEX,
      offerSync: overrides.offerSync ?? false,
    },
  }).start();

  started.push(actor);
  await settle();

  return { actor, fake };
}

async function start(
  script: OnboardingDmkScript,
  overrides: Parameters<typeof launch>[1] = {},
): Promise<{ actor: OnboardingActor; fake: FakeOnboardingDmk }> {
  const launched = await launch(script, overrides);

  if (stateOf(launched.actor) === "awaitingStart") {
    launched.actor.send({ type: "CONTINUE" });
    await settle();
  }

  return launched;
}

async function enterSetup(
  overrides: Partial<{
    deviceModelId: DeviceModelId;
    offerSync: boolean;
  }> = {},
): Promise<{ actor: OnboardingActor; fake: FakeOnboardingDmk }> {
  const needsNanoFirmware =
    overrides.deviceModelId === DeviceModelId.NANO_X ||
    overrides.deviceModelId === DeviceModelId.NANO_SP;
  return start(
    {
      osVersion: [os(needsNanoFirmware ? { ...unseeded, seVersion: "2.4.0" } : unseeded)],
      ...passingChecks,
    },
    overrides,
  );
}

async function follow(actor: OnboardingActor, steps: OnboardingStep[]): Promise<void> {
  for (const step of steps) {
    actor.send(stepChanged(step));
  }
}

function stepChanged(
  currentOnboardingStep: OnboardingStep,
  extras: Partial<DeviceOnboardingState> = {},
) {
  return {
    type: "STEP_CHANGED" as const,
    state: {
      isOnboarded: false,
      isInRecoveryMode: false,
      managerAllowed: false,
      currentOnboardingStep,
      seedWordIndex: 0,
      seedPhraseWordCount: 24 as const,
      recoveryKeyStatus: null,
      ...extras,
    },
  };
}

function handoverScript(
  osVersion: ScriptedCommand<GetOsVersionResponse>[],
  overrides: Partial<OnboardingDmkScript> = {},
): OnboardingDmkScript {
  return { osVersion, genuineCheck: [genuine], firmwareCheck: [updateAvailable], ...overrides };
}

async function handOverAndReturn(actor: OnboardingActor, sessionId = "session"): Promise<void> {
  actor.send({ type: "USER_ACCEPT" });
  await settle();
  actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId });
  await settle();
}

function scriptReaching(state: string): OnboardingDmkScript {
  const base = { osVersion: [os(unseeded)] };

  switch (state) {
    case "checksIdle":
    case "genuineFailed":
      return { ...base, genuineCheck: [deviceRefusal] };
    case "firmwareUpdateOffered":
      return { ...base, genuineCheck: [genuine], firmwareCheck: [updateAvailable] };
    case "deviceLocked":
      return { ...passingChecks, osVersion: [os(unseeded), lockedDevice] };
    default:
      return { ...base, ...passingChecks };
  }
}

async function reach(actor: OnboardingActor, state: string): Promise<void> {
  if (state === "checksIdle") {
    actor.send({ type: "CLOSE" });
  }

  if (state === "deviceLocked") {
    actor.send({ type: "LOCKED" });
  }

  await settle();

  expect(stateOf(actor)).toBe(state);
}

function expectChecksPassed(actor: OnboardingActor): void {
  expect(stateOf(actor)).toBe("waiting");
}

function awaitsApproval(actor: OnboardingActor): boolean {
  return actor.getSnapshot().matches({ checks: { genuineCheck: "awaitingApproval" } });
}

function stateOf(actor: OnboardingActor): string {
  const { value } = actor.getSnapshot();

  if (typeof value === "string") return value;
  const child = Object.values(value)[0];

  return typeof child === "string" ? child : Object.keys(child)[0];
}

function exitOf(actor: OnboardingActor) {
  const snapshot = actor.getSnapshot();

  expect(snapshot.status).toBe("done");

  return snapshot.output;
}

function os(options: OsVersionResponseOptions): ScriptedCommand<GetOsVersionResponse> {
  return CommandResultFactory({ data: createOsVersionResponse(options) });
}

function refusedToggle(
  errorCode: ToggleEarlyCheckErrorCode,
): ScriptedCommand<void, ToggleEarlyCheckErrorCode> {
  return CommandResultFactory({
    error: new ToggleEarlyCheckCommandError({ errorCode, message: "refused" }),
  });
}

function metadata(update: AvailableFirmwareUpdate | undefined): GetDeviceMetadataDAOutput {
  return {
    firmwareVersion: { os: "1.4.0", mcu: "2.0.0", bootloader: "3.0.0" },
    firmwareUpdateContext: { availableUpdate: update },
  } as GetDeviceMetadataDAOutput;
}

const wholeReadDeviceStateBackoffMs = 1500;

function settleRetries(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, wholeReadDeviceStateBackoffMs);
  });
}
