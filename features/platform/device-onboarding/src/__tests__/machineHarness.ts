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
} from "../device/toggleEarlyCheckCommand";
import { deviceOnboardingMachine } from "../machine";
import { settle } from "./actorHarness";
import {
  createFakeOnboardingDmk,
  type FakeOnboardingDmk,
  type OnboardingDmkScript,
  type ScriptedCommand,
} from "../tests/fakeDmk";
import { createOsVersionResponse, type OsVersionResponseOptions } from "../tests/osVersionResponse";
import {
  OnboardingStep,
  RecoveryKeyStatus,
  SeedPath,
  type AvailableFirmwareUpdate,
  type DeviceOnboardingContext,
  type DeviceOnboardingState,
} from "../types";

// Shared by the machine.*.test.ts files.

export const unseeded: OsVersionResponseOptions = {
  onboardingState: "welcome-screen-1",
  numberOfWords: 24,
  currentWordIndex: 0,
};

export const seeded: OsVersionResponseOptions = {
  onboardingState: "device-is-ready",
  numberOfWords: 24,
  currentWordIndex: 0,
  isOnboarded: true,
};

export const availableUpdate = {
  finalFirmware: { version: "1.5.0" },
} as unknown as AvailableFirmwareUpdate;

export const genuine = { completes: { isGenuine: true } as GenuineCheckDAOutput };
export const notGenuine = { completes: { isGenuine: false } as GenuineCheckDAOutput };
export const upToDate = { completes: metadata(undefined) };
export const updateAvailable = { completes: metadata(availableUpdate) };

export const lockedDevice: ScriptedCommand<GetOsVersionResponse> = { throws: new Error("locked") };

const started: OnboardingActor[] = [];

afterEach(() => {
  while (started.length > 0) {
    started.pop()?.stop();
  }
});

export const deviceRefusal = { fails: { _tag: "RefusedByUserDAError" } };
export const checkFailure = { fails: new UnknownDAError() };
export const secureConnectionPrompt = { prompts: UserInteractionRequired.AllowSecureConnection };

export const passingChecks: OnboardingDmkScript = {
  genuineCheck: [genuine],
  firmwareCheck: [upToDate],
};

export type OnboardingActor = Actor<typeof deviceOnboardingMachine>;

export async function launch(
  script: OnboardingDmkScript,
  overrides: Partial<{
    deviceModelId: DeviceModelId;
    offerSync: boolean;
    hostsSeedSetup: boolean;
    omitHostsSeedSetup: boolean;
    leaveOnboarding: (reason: string, context: DeviceOnboardingContext) => void;
  }> = {},
): Promise<{ actor: OnboardingActor; fake: FakeOnboardingDmk }> {
  const fake = createFakeOnboardingDmk(script);
  const machine = deviceOnboardingMachine.provide({
    actions: {
      leaveOnboarding: ({ context }, params) => overrides.leaveOnboarding?.(params.reason, context),
    },
  });

  const actor = createActor(machine, {
    input: {
      dmk: fake.dmk,
      sessionId: "session",
      deviceId: "device",
      deviceModelId: overrides.deviceModelId ?? DeviceModelId.FLEX,
      offerSync: overrides.offerSync ?? false,
      ...(overrides.omitHostsSeedSetup ? {} : { hostsSeedSetup: overrides.hostsSeedSetup ?? true }),
    },
  }).start();

  started.push(actor);
  await settle();

  return { actor, fake };
}

export async function start(
  script: OnboardingDmkScript,
  overrides: Parameters<typeof launch>[1] = {},
): Promise<{ actor: OnboardingActor; fake: FakeOnboardingDmk }> {
  const launched = await launch(script, overrides);

  if (stateOf(launched.actor) === "awaitingStart") {
    launched.actor.send({ type: "CONTINUE" });
    await settle();
  }

  await leaveSuccessScreen(launched.actor);

  return launched;
}

export async function enterSetup(
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
      osVersion: [os(needsNanoFirmware ? { ...unseeded, seVersion: "2.7.1" } : unseeded)],
      ...passingChecks,
    },
    overrides,
  );
}

export async function follow(actor: OnboardingActor, steps: OnboardingStep[]): Promise<void> {
  for (const step of steps) {
    actor.send(stepChanged(step));
  }
}

export function stepChanged(
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

export function handoverScript(
  osVersion: ScriptedCommand<GetOsVersionResponse>[],
  overrides: Partial<OnboardingDmkScript> = {},
): OnboardingDmkScript {
  return {
    osVersion,
    genuineCheck: [genuine, genuine],
    firmwareCheck: [updateAvailable],
    ...overrides,
  };
}

export async function handOverAndReturn(
  actor: OnboardingActor,
  sessionId = "session",
): Promise<void> {
  actor.send({ type: "USER_ACCEPT" });
  await settle();
  actor.send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId });
  await settle();
  await leaveSuccessScreen(actor);
}

export async function handOverAfterReboot(
  actor: OnboardingActor,
  sessionId = "session-after-update",
): Promise<void> {
  actor.send({ type: "USER_ACCEPT" });
  await settle();
  actor.send({ type: "FIRMWARE_UPDATE_RECONNECT_REQUIRED" });
  await settle();
  actor.send({ type: "SESSION_READY", sessionId });
  await settle();
  await leaveSuccessScreen(actor);
}

export function scriptReaching(state: string): OnboardingDmkScript {
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

export async function reach(actor: OnboardingActor, state: string): Promise<void> {
  if (state === "checksIdle") {
    actor.send({ type: "CLOSE" });
  }

  if (state === "deviceLocked") {
    actor.send({ type: "LOCKED" });
  }

  await settle();

  expect(stateOf(actor)).toBe(state);
}

export async function leaveSuccessScreen(actor: OnboardingActor): Promise<void> {
  if (stateOf(actor) !== "checksSucceeded") return;
  actor.send({ type: "CONTINUE" });
  await settle();
}

export async function expectChecksPassed(actor: OnboardingActor): Promise<void> {
  await leaveSuccessScreen(actor);
  expect(stateOf(actor)).toBe("waiting");
}

export function awaitsApproval(actor: OnboardingActor): boolean {
  return actor.getSnapshot().matches({ checks: { genuineCheck: "awaitingApproval" } });
}

export function stateOf(actor: OnboardingActor): string {
  const { value } = actor.getSnapshot();

  if (typeof value === "string") return value;
  const child = Object.values(value)[0];

  return typeof child === "string" ? child : Object.keys(child)[0];
}

export function exitOf(actor: OnboardingActor) {
  const snapshot = actor.getSnapshot();

  expect(snapshot.status).toBe("done");

  return snapshot.output;
}

export function os(options: OsVersionResponseOptions): ScriptedCommand<GetOsVersionResponse> {
  return CommandResultFactory({ data: createOsVersionResponse(options) });
}

export function refusedToggle(
  errorCode: ToggleEarlyCheckErrorCode,
): ScriptedCommand<void, ToggleEarlyCheckErrorCode> {
  return CommandResultFactory({
    error: new ToggleEarlyCheckCommandError({ errorCode, message: "refused" }),
  });
}

export function metadata(update: AvailableFirmwareUpdate | undefined): GetDeviceMetadataDAOutput {
  return {
    firmwareVersion: { os: "1.4.0", mcu: "2.0.0", bootloader: "3.0.0" },
    firmwareUpdateContext: { availableUpdate: update },
  } as GetDeviceMetadataDAOutput;
}

const wholeReadDeviceStateBackoffMs = 1500;

export function settleRetries(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, wholeReadDeviceStateBackoffMs);
  });
}
