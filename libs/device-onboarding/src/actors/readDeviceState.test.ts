import {
  CommandResultFactory,
  GetOsVersionCommand,
  InvalidStatusWordError,
  type DeviceManagementKit,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import { createRetryPolicy } from "../retry";
import { runActor, settle } from "../tests/actorHarness";
import { createFakeCommandDmk, type ScriptedCommand } from "../tests/fakeDmk";
import { createOsVersionResponse, type OsVersionResponseOptions } from "../tests/osVersionResponse";
import { OnboardingStep, type DeviceOnboardingState } from "../types";
import { mapDeviceState, readDeviceState, type ReadDeviceStateEvent } from "./readDeviceState";

const onboardedDevice: OsVersionResponseOptions = {
  onboardingState: "device-is-ready",
  numberOfWords: 24,
  currentWordIndex: 0,
  isOnboarded: true,
  isSecureConnectionAllowed: true,
};

const onboardedDeviceState: DeviceOnboardingState = {
  isOnboarded: true,
  isInRecoveryMode: false,
  managerAllowed: true,
  currentOnboardingStep: OnboardingStep.Ready,
  seedWordIndex: 0,
  seedPhraseWordCount: 24,
};

describe("mapDeviceState", () => {
  it("reports a decoded device as read", () => {
    expect(mapDeviceState(createOsVersionResponse(onboardedDevice))).toEqual({
      type: "DEVICE_STATE_READ",
      state: onboardedDeviceState,
    });
  });

  it("takes the manager approval from the secure connection flag", () => {
    const event = mapDeviceState(
      createOsVersionResponse({ ...onboardedDevice, isSecureConnectionAllowed: false }),
    );

    expect(event).toMatchObject({ state: { managerAllowed: false } });
  });

  it("reports the recovery mode of a device restoring its seed", () => {
    const event = mapDeviceState(
      createOsVersionResponse({
        onboardingState: "restore-recovery-phrase",
        numberOfWords: 18,
        currentWordIndex: 5,
        isInRecoveryMode: true,
      }),
    );

    expect(event).toEqual({
      type: "DEVICE_STATE_READ",
      state: {
        isOnboarded: false,
        isInRecoveryMode: true,
        managerAllowed: false,
        currentOnboardingStep: OnboardingStep.RestoreSeed,
        seedWordIndex: 5,
        seedPhraseWordCount: 18,
      },
    });
  });

  it("reports a bootloader before anything else", () => {
    expect(
      mapDeviceState(createOsVersionResponse({ ...onboardedDevice, isBootloader: true })),
    ).toEqual({ type: "DEVICE_IN_BOOTLOADER" });
  });

  it("reports an OS updater before anything else", () => {
    expect(mapDeviceState(createOsVersionResponse({ ...onboardedDevice, isOsu: true }))).toEqual({
      type: "DEVICE_IN_OSU",
    });
  });

  it("keeps the onboarding flag when the step is not recognised", () => {
    expect(
      mapDeviceState(
        createOsVersionResponse({
          ...onboardedDevice,
          onboardingState: "a-state-we-do-not-know",
        }),
      ),
    ).toEqual({
      type: "DEVICE_STATE_UNREADABLE",
      isOnboarded: true,
      isInRecoveryMode: false,
    });
  });

  it("is unreadable on the catalogue version, which decodes no step", () => {
    expect(mapDeviceState(createOsVersionResponse())).toEqual({
      type: "DEVICE_STATE_UNREADABLE",
      isOnboarded: false,
      isInRecoveryMode: false,
    });
  });
});

describe("readDeviceState", () => {
  it("reports the state read from the OS version command", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([success(onboardedDevice)]);
    const { received, stop } = start(dmk);

    await settle();

    expect(sendCommand).toHaveBeenCalledWith({
      sessionId: "session",
      command: expect.any(GetOsVersionCommand),
    });
    expect(received).toEqual([{ type: "DEVICE_STATE_READ", state: onboardedDeviceState }]);
    stop();
  });

  it("retries a failed command until it answers", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([
      { throws: new Error("transport failed") },
      success(onboardedDevice),
    ]);
    const { received, stop } = start(dmk);

    await settle();

    expect(sendCommand).toHaveBeenCalledTimes(2);
    expect(received).toEqual([{ type: "DEVICE_STATE_READ", state: onboardedDeviceState }]);
    stop();
  });

  it("fails only once the retries are exhausted", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([{ throws: new Error("transport failed") }]);
    const { received, stop } = start(dmk);

    await settle();

    expect(sendCommand).toHaveBeenCalledTimes(3);
    expect(received).toEqual([{ type: "DEVICE_STATE_FAILED" }]);
    stop();
  });

  it("does not send the command again when it is stopped during a retry delay", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([{ throws: new Error("transport failed") }]);
    const { received, stop } = start(dmk);

    stop();
    await settle();

    expect(sendCommand).toHaveBeenCalledTimes(1);
    expect(received).toEqual([]);
  });

  it("fails when the device answers with an error status word", async () => {
    const { dmk } = createFakeCommandDmk([
      CommandResultFactory({ error: new InvalidStatusWordError("6a80") }),
    ]);
    const { received, stop } = start(dmk);

    await settle();

    expect(received).toEqual([{ type: "DEVICE_STATE_FAILED" }]);
    stop();
  });

  it("reports nothing once the actor is stopped", async () => {
    const { dmk } = createFakeCommandDmk([success(onboardedDevice)]);
    const { received, stop } = start(dmk);

    stop();
    await settle();

    expect(received).toEqual([]);
  });
});

function success(
  options: Parameters<typeof createOsVersionResponse>[0],
): ScriptedCommand<GetOsVersionResponse> {
  return CommandResultFactory({ data: createOsVersionResponse(options) });
}

function start(dmk: DeviceManagementKit) {
  return runActor<ReadDeviceStateEvent>(readDeviceState, {
    dmk,
    sessionId: "session",
    retryPolicy: { ...createRetryPolicy(() => true), delaysMs: [0, 0] },
  });
}
