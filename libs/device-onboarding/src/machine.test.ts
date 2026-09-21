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
import type { DeviceOnboardingPorts } from "./ports";
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
import { OnboardingStep, type AvailableFirmwareUpdate, type DeviceOnboardingState } from "./types";

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

const deviceRefusal = { fails: { _tag: "RefusedByUserDAError" } };
const checkFailure = { fails: new UnknownDAError() };
const secureConnectionPrompt = { prompts: UserInteractionRequired.AllowSecureConnection };

const passingChecks: OnboardingDmkScript = { genuineCheck: [genuine], firmwareCheck: [upToDate] };

describe("routing", () => {
  it("runs the checks of an unseeded touchscreen under the on-device waiting screen", async () => {
    const { actor, fake } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    expect(stateOf(actor)).toBe("checksSucceeded");
    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
  });

  it("never shows the on-device screen to a nano, which has none", async () => {
    const { actor, fake } = await start(
      { osVersion: [os({ ...unseeded, seVersion: "2.4.0" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_X },
    );

    expect(stateOf(actor)).toBe("checksSucceeded");
    expect(fake.earlyCheckToggles()).toEqual([]);
  });

  it("never shows the on-device screen to a seeded device, whose firmware refuses the APDU", async () => {
    const { actor, fake } = await start({ osVersion: [os(seeded)], ...passingChecks });

    expect(stateOf(actor)).toBe("checksSucceeded");
    expect(fake.earlyCheckToggles()).toEqual([]);
  });

  it("checks a device whose onboarding step it cannot parse, which is every device today", async () => {
    const { actor } = await start({ osVersion: [os({})], ...passingChecks });

    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it.each([
    ["unseeded", unseeded],
    ["seeded long ago", seeded],
  ])(
    "sends a nano %s on an old firmware to legacy, before anything is done to it",
    async (_case, state) => {
      const { actor, fake } = await start(
        { osVersion: [os({ ...state, seVersion: "0.9.0" })], ...passingChecks },
        { deviceModelId: DeviceModelId.NANO_X },
      );

      expect(exitOf(actor)).toMatchObject({ reason: "legacyFallback" });
      expect(fake.genuineCheckRuns()).toBe(0);
    },
  );

  it("sends a nano s to legacy on the firmware that is the best it will ever run", async () => {
    const { actor, fake } = await start(
      { osVersion: [os({ ...unseeded, seVersion: "2.1.0" })], ...passingChecks },
      { deviceModelId: DeviceModelId.NANO_S },
    );

    expect(exitOf(actor)).toMatchObject({ reason: "legacyFallback" });
    expect(fake.genuineCheckRuns()).toBe(0);
  });

  it("keeps a nano sitting exactly on its model floor", async () => {
    const { actor } = await start(
      {
        osVersion: [os({ ...unseeded, seVersion: minimumNanoVersions.get(DeviceModelId.NANO_X) })],
        ...passingChecks,
      },
      { deviceModelId: DeviceModelId.NANO_X },
    );

    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it("drives a touchscreen whatever firmware it runs, since only the nanos have a floor", async () => {
    const { actor } = await start({
      osVersion: [os({ ...unseeded, seVersion: "0.9.0" })],
      ...passingChecks,
    });

    expect(stateOf(actor)).toBe("checksSucceeded");
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
    expect(stateOf(actor)).toBe("checksSucceeded");
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
    expect(stateOf(actor)).toBe("checksSucceeded");
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
    expect(stateOf(actor)).toBe("checksSucceeded");
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
    expect(stateOf(actor)).toBe("checksSucceeded");
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
    const ports = rebindingPorts();
    const { actor, fake } = await start(
      { osVersion: [os(unseeded)], genuineCheck: [genuine, genuine], firmwareCheck: [upToDate] },
      { ports },
    );

    ports.rebind();
    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it("carries the device's request to allow a secure connection to the app", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [secureConnectionPrompt],
    });

    expect(actor.getSnapshot().context.secureConnectionRequested).toBe(true);
    expect(stateOf(actor)).toBe("genuineCheck");
  });

  it.each(["LOCKED", "TRANSPORT_LOST", "QUIT"] as const)(
    "takes that request back on %s, which leaves the check with no one to answer it",
    async type => {
      const { actor } = await start({
        osVersion: [os(unseeded)],
        genuineCheck: [secureConnectionPrompt],
      });

      actor.send({ type });
      await settle();

      expect(actor.getSnapshot().context.secureConnectionRequested).toBe(false);
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
    expect(stateOf(actor)).toBe("checksSucceeded");
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
    expect(stateOf(actor)).toBe("checksSucceeded");
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

    expect(stateOf(actor)).toBe("checksSucceeded");
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
    actor.send({ type: resume });
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

    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it("lets the user skip a check it could not complete", async () => {
    const { actor } = await start({
      osVersion: [os(unseeded)],
      genuineCheck: [genuine],
      firmwareCheck: [checkFailure],
    });

    actor.send({ type: "SKIP" });
    await settle();

    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it("runs again on the device that came back on another session", async () => {
    const ports = rebindingPorts();
    const { actor, fake } = await start(
      {
        osVersion: [os(unseeded)],
        genuineCheck: [genuine, genuine],
        firmwareCheck: [upToDate, upToDate],
      },
      { ports },
    );

    ports.rebind();
    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY" });
    await settle();

    expect(fake.firmwareCheckRuns()).toBe(2);
    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it("never hands the update it found to the device that replaced that one", async () => {
    const ports = rebindingPorts();
    const { actor } = await start(
      {
        osVersion: [os(unseeded)],
        genuineCheck: [genuine, genuine],
        firmwareCheck: [updateAvailable, upToDate],
      },
      { ports },
    );

    expect(stateOf(actor)).toBe("firmwareUpdateOffered");

    ports.rebind();
    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY" });
    await settle();

    expect(stateOf(actor)).toBe("checksSucceeded");
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
    actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });

    expect(stateOf(actor)).toBe("readingState");
  });

  it("completes the checks when the device comes back updated", async () => {
    const { actor } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    await handOverAndReturn(actor);

    expect(stateOf(actor)).toBe("checksSucceeded");
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
    const ports = rebindingPorts();
    const { actor } = await start(handoverScript([os(unseeded), os({ isBootloader: true })]), {
      ports,
    });

    await handOverAndReturn(actor, ports);

    expect(exitOf(actor)).toMatchObject({ sessionId: "session-after-update" });
  });

  it("waits through the reboot that drops the transport, rather than leaving the handover", async () => {
    const ports = rebindingPorts();
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
      { ports },
    );

    actor.send({ type: "USER_ACCEPT" });
    await settle();
    ports.rebind();
    actor.send({ type: "TRANSPORT_LOST" });
    await settle();

    expect(stateOf(actor)).toBe("firmwareUpdateDelegated");

    actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
    await settle();

    expect(stateOf(actor)).toBe("checksSucceeded");
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
    const ports = rebindingPorts();
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], {
        genuineCheck: [genuine, genuine],
        firmwareCheck: [updateAvailable, upToDate],
      }),
      { ports },
    );

    await handOverAndReturn(actor, ports);

    expect(fake.genuineCheckRuns()).toBe(1);
    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it("dismisses the on-device screen a cancelled update left up", async () => {
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    await handOverAndReturn(actor);

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);
    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it("does not check a device twice for being genuine on the session it already attested", async () => {
    const { actor, fake } = await start(
      handoverScript([os(unseeded)], { firmwareCheck: [updateAvailable, upToDate] }),
    );

    await handOverAndReturn(actor);

    expect(fake.genuineCheckRuns()).toBe(1);
    expect(stateOf(actor)).toBe("checksSucceeded");
  });
});

describe("the end of the checks", () => {
  it("holds until the user acknowledges them", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    await settle();

    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it("has already dismissed the on-device screen by the time the user taps", async () => {
    const { actor, fake } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    expect(fake.earlyCheckToggles()).toEqual([EarlyCheckToggle.Enter, EarlyCheckToggle.Exit]);

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(stateOf(actor)).toBe("waiting");
    actor.stop();
  });

  it("sends a device that still has to be set up to the setup phase", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(stateOf(actor)).toBe("waiting");
    actor.stop();
  });

  it("offers Ledger Sync to a device that was already onboarded on entry", async () => {
    const { actor } = await start(
      { osVersion: [os(seeded)], ...passingChecks },
      { offerSync: true },
    );

    actor.send({ type: "CONTINUE" });

    expect(exitOf(actor)).toMatchObject({ reason: "offerLedgerSync" });
  });

  it("ends an already onboarded device without the offer when sync is not on the table", async () => {
    const { actor } = await start({ osVersion: [os(seeded)], ...passingChecks });

    actor.send({ type: "CONTINUE" });

    expect(exitOf(actor)).toMatchObject({ reason: "completed" });
  });
});

describe("global handlers", () => {
  it("waits for a locked device to be unlocked, rather than falling back", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "LOCKED" });

    expect(stateOf(actor)).toBe("deviceLocked");
  });

  it("re-reads the device once it is unlocked", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();

    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it("waits for a new session when the transport is lost", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "TRANSPORT_LOST" });

    expect(stateOf(actor)).toBe("awaitingSession");
  });

  it("re-reads the device on the session the app reopened", async () => {
    const { actor } = await start({ osVersion: [os(unseeded)], ...passingChecks });

    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY" });
    await settle();

    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it("starts over on a new session, rather than holding a failure the user dismissed", async () => {
    const ports = rebindingPorts();
    const { actor, fake } = await start(
      {
        osVersion: [os(unseeded)],
        genuineCheck: [deviceRefusal, genuine],
        firmwareCheck: [upToDate],
      },
      { ports },
    );

    actor.send({ type: "CLOSE" });
    await settle();
    ports.rebind();
    actor.send({ type: "TRANSPORT_LOST" });
    actor.send({ type: "SESSION_READY" });
    await settle();

    expect(fake.genuineCheckRuns()).toBe(2);
    expect(actor.getSnapshot().context.lastGenuineFailure).toBeNull();
    expect(stateOf(actor)).toBe("checksSucceeded");
  });

  it.each([
    "checksIdle",
    "genuineFailed",
    "firmwareUpdateOffered",
    "checksSucceeded",
    "deviceLocked",
  ])("leaves the flow on the onboarding cross from %s", async state => {
    const { actor } = await start(scriptReaching(state));

    await reach(actor, state);
    actor.send({ type: "QUIT" });
    await settle();

    expect(exitOf(actor)).toMatchObject({ reason: "userQuit" });
  });

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
    expect(actor.getSnapshot().context.ports.closeSession).not.toHaveBeenCalled();
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

    expect(stateOf(actor)).toBe("checksSucceeded");
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

  it("still treats a device as unseeded on CONTINUE after a seed appears mid-setup", async () => {
    const { actor } = await start(
      {
        osVersion: [os(unseeded), os({ ...unseeded, onboardingState: "pin", isOnboarded: true })],
        ...passingChecks,
      },
      { offerSync: true },
    );

    actor.send({ type: "CONTINUE" });
    await settle();
    actor.send(stepChanged(OnboardingStep.Pin, { isOnboarded: true }));
    actor.send({ type: "LOCKED" });
    actor.send({ type: "UNLOCKED" });
    await settle();
    actor.send({ type: "CONTINUE" });
    await settle();

    expect(actor.getSnapshot().status).not.toBe("done");
    expect(stateOf(actor)).toBe("pin");
    expect(actor.getSnapshot().context.onboardedOnEntry).toBe(false);
    actor.stop();
  });

  it("reads the session id at exit, not the one the machine started with", async () => {
    const ports = rebindingPorts();
    const { actor } = await enterSetup({ ports });

    ports.rebind();
    actor.send(stepChanged(OnboardingStep.Ready));

    expect(exitOf(actor)).toEqual({
      sessionId: "session-after-update",
      device: { id: "device", modelId: DeviceModelId.FLEX },
      reason: "completed",
    });
  });

  it("leaves the session open on the Ledger Sync exit too", async () => {
    const ports = rebindingPorts();
    const { actor } = await start(
      { osVersion: [os(seeded)], ...passingChecks },
      { offerSync: true, ports },
    );

    ports.rebind();
    actor.send({ type: "CONTINUE" });

    expect(exitOf(actor)).toEqual({
      sessionId: "session-after-update",
      device: { id: "device", modelId: DeviceModelId.FLEX },
      reason: "offerLedgerSync",
    });
    expect(ports.closeSession).not.toHaveBeenCalled();
  });

  it("polls the device for the whole setup phase and stops once it has exited", async () => {
    const { actor, fake } = await start({ osVersion: [os(unseeded)], ...passingChecks });
    const commandsAfterChecks = fake.sendCommand.mock.calls.length;

    actor.send({ type: "CONTINUE" });
    await settle();

    expect(fake.sendCommand.mock.calls.length).toBeGreaterThan(commandsAfterChecks);

    actor.send(stepChanged(OnboardingStep.Ready));
    const commandsOnceDone = fake.sendCommand.mock.calls.length;

    jest.useFakeTimers();
    await jest.advanceTimersByTimeAsync(3_000);
    jest.useRealTimers();

    expect(fake.sendCommand.mock.calls.length).toBe(commandsOnceDone);
  });
});

type OnboardingActor = Actor<typeof deviceOnboardingMachine>;

type ReboundPorts = DeviceOnboardingPorts & { rebind(): void };

async function start(
  script: OnboardingDmkScript,
  overrides: Partial<{
    deviceModelId: DeviceModelId;
    offerSync: boolean;
    ports: DeviceOnboardingPorts;
  }> = {},
): Promise<{ actor: OnboardingActor; fake: FakeOnboardingDmk }> {
  const fake = createFakeOnboardingDmk(script);

  const actor = createActor(deviceOnboardingMachine, {
    input: {
      dmk: fake.dmk,
      ports: overrides.ports ?? fixedPorts(),
      deviceId: "device",
      deviceModelId: overrides.deviceModelId ?? DeviceModelId.FLEX,
      offerSync: overrides.offerSync ?? false,
    },
  }).start();

  await settle();

  return { actor, fake };
}

async function enterSetup(
  overrides: Partial<{
    deviceModelId: DeviceModelId;
    offerSync: boolean;
    ports: DeviceOnboardingPorts;
  }> = {},
): Promise<{ actor: OnboardingActor; fake: FakeOnboardingDmk }> {
  const needsNanoFirmware =
    overrides.deviceModelId === DeviceModelId.NANO_X ||
    overrides.deviceModelId === DeviceModelId.NANO_SP;
  const started = await start(
    {
      osVersion: [os(needsNanoFirmware ? { ...unseeded, seVersion: "2.4.0" } : unseeded)],
      ...passingChecks,
    },
    overrides,
  );

  started.actor.send({ type: "CONTINUE" });
  await settle();

  return started;
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
      ...extras,
    },
  };
}

function fixedPorts(): DeviceOnboardingPorts {
  return {
    openSession: jest.fn(),
    currentSessionId: jest.fn(() => "session"),
    closeSession: jest.fn(),
  };
}

function rebindingPorts(): ReboundPorts {
  let rebound = false;

  return {
    openSession: jest.fn(),
    currentSessionId: jest.fn(() => (rebound ? "session-after-update" : "session")),
    closeSession: jest.fn(),
    rebind: () => {
      rebound = true;
    },
  };
}

function handoverScript(
  osVersion: ScriptedCommand<GetOsVersionResponse>[],
  overrides: Partial<OnboardingDmkScript> = {},
): OnboardingDmkScript {
  return { osVersion, genuineCheck: [genuine], firmwareCheck: [updateAvailable], ...overrides };
}

async function handOverAndReturn(actor: OnboardingActor, ports?: ReboundPorts): Promise<void> {
  actor.send({ type: "USER_ACCEPT" });
  await settle();
  ports?.rebind();
  actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
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

function stateOf(actor: OnboardingActor): string {
  const { value } = actor.getSnapshot();

  return typeof value === "string" ? value : String(Object.values(value)[0]);
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
  return { firmwareUpdateContext: { availableUpdate: update } } as GetDeviceMetadataDAOutput;
}

const wholeReadDeviceStateBackoffMs = 1500;

function settleRetries(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, wholeReadDeviceStateBackoffMs);
  });
}
