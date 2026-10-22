import {
  CloseAppCommand,
  CommandResultFactory,
  GetAppAndVersionCommand,
  InvalidStatusWordError,
  type DeviceManagementKit,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import { createRetryPolicy } from "../retry";
import { runActor, settle } from "../tests/actorHarness";
import { createDeviceManagementKit } from "../tests/createDeviceManagementKit";
import { commandNames } from "../tests/dashboardDevice";
import { createFakeCommandDmk, type ScriptedCommand } from "../tests/fakeDmk";
import {
  createOsVersionResponse,
  defaultSeVersion,
  type OsVersionResponseOptions,
} from "../tests/osVersionResponse";
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
  recoveryKeyStatus: null,
};

const readEvent: ReadDeviceStateEvent = {
  type: "DEVICE_STATE_READ",
  state: onboardedDeviceState,
  firmwareVersion: defaultSeVersion,
};

describe("mapDeviceState", () => {
  it("reports a decoded device as read", () => {
    expect(mapDeviceState(createOsVersionResponse(onboardedDevice))).toEqual({
      type: "DEVICE_STATE_READ",
      state: onboardedDeviceState,
      firmwareVersion: defaultSeVersion,
    });
  });

  it("carries the firmware version, which routing decides on before anything is read", () => {
    const event = mapDeviceState(
      createOsVersionResponse({ ...onboardedDevice, seVersion: "1.2.0" }),
    );

    expect(event).toMatchObject({ firmwareVersion: "1.2.0" });
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
        recoveryKeyStatus: null,
      },
      firmwareVersion: defaultSeVersion,
    });
  });

  it("reports a bootloader before anything else", () => {
    expect(
      mapDeviceState(createOsVersionResponse({ ...onboardedDevice, isBootloader: true })),
    ).toEqual({ type: "DEVICE_IN_BOOTLOADER", output: defaultSeVersion });
  });

  it("reports an OS updater before anything else", () => {
    expect(mapDeviceState(createOsVersionResponse({ ...onboardedDevice, isOsu: true }))).toEqual({
      type: "DEVICE_IN_OSU",
      output: defaultSeVersion,
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
      firmwareVersion: defaultSeVersion,
    });
  });

  it("is unreadable on the catalogue version, which decodes no step", () => {
    expect(mapDeviceState(createOsVersionResponse())).toEqual({
      type: "DEVICE_STATE_UNREADABLE",
      isOnboarded: false,
      isInRecoveryMode: false,
      firmwareVersion: defaultSeVersion,
    });
  });
});

describe("readDeviceState", () => {
  it("reads the state on the dashboard without closing anything", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([success(onboardedDevice)]);
    const { received, stop } = start(dmk);

    await settle();

    expect(commandNames(sendCommand)).toEqual(["getAppAndVersion", "getOsVersion"]);
    expect(received).toEqual([readEvent]);
    stop();
  });

  it("closes an open app, then reads the state on the dashboard", async () => {
    const { dmk, sendCommand, device } = createFakeCommandDmk([success(onboardedDevice)]);
    device.openApp("Bitcoin");
    const { received, stop } = start(dmk);

    await settle();

    expect(commandNames(sendCommand)).toEqual(["getAppAndVersion", "closeApp", "getOsVersion"]);
    expect(received).toEqual([readEvent]);
    stop();
  });

  it("still reads the state when the device does not tell its app", async () => {
    const { dmk, sendCommand } = fakeDevice({
      app: () =>
        Promise.resolve(CommandResultFactory({ error: new InvalidStatusWordError("6e00") })),
    });
    const { received, stop } = start(dmk);

    await settle();

    expect(commandNames(sendCommand)).toEqual(["getAppAndVersion", "getOsVersion"]);
    expect(received).toEqual([readEvent]);
    stop();
  });

  it("does not close the app once stopped during the app check", async () => {
    let stopActor: (() => void) | undefined;
    const { dmk, sendCommand } = fakeDevice({
      app: () => {
        stopActor?.();
        return running("Bitcoin");
      },
    });
    const { received, stop } = start(dmk);
    stopActor = stop;

    await settle();

    expect(commandNames(sendCommand)).toEqual(["getAppAndVersion"]);
    expect(received).toEqual([]);
  });

  it("does not read the state once stopped while the app is closing", async () => {
    let stopActor: (() => void) | undefined;
    const { dmk, sendCommand } = fakeDevice({
      app: () => running("Bitcoin"),
      closeApp: () => {
        stopActor?.();
        return Promise.resolve(appClosed);
      },
    });
    const { received, stop } = start(dmk);
    stopActor = stop;

    await settle();

    expect(commandNames(sendCommand)).toEqual(["getAppAndVersion", "closeApp"]);
    expect(received).toEqual([]);
  });

  it("retries a failed command until it answers", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([
      { throws: new Error("transport failed") },
      success(onboardedDevice),
    ]);
    const { received, stop } = start(dmk);

    await settle();

    expect(stateReads(sendCommand)).toBe(2);
    expect(received).toEqual([readEvent]);
    stop();
  });

  it("fails only once the retries are exhausted", async () => {
    const error = new Error("transport failed");
    const { dmk, sendCommand } = createFakeCommandDmk([{ throws: error }]);
    const { received, stop } = start(dmk);

    await settle();

    expect(stateReads(sendCommand)).toBe(3);
    expect(received).toEqual([{ type: "DEVICE_STATE_FAILED", output: error }]);
    stop();
  });

  it("does not send the command again when it is stopped during a retry delay", async () => {
    let stopActor: (() => void) | undefined;
    const { dmk, sendCommand } = fakeDevice({
      read: () => {
        stopActor?.();
        return Promise.reject(new Error("transport failed"));
      },
    });
    const { received, stop } = start(dmk);
    stopActor = stop;

    await settle();

    expect(stateReads(sendCommand)).toBe(1);
    expect(received).toEqual([]);
  });

  it("fails when the device answers with an error status word", async () => {
    const error = new InvalidStatusWordError("6a80");
    const { dmk } = createFakeCommandDmk([CommandResultFactory({ error })]);
    const { received, stop } = start(dmk);

    await settle();

    expect(received).toEqual([{ type: "DEVICE_STATE_FAILED", output: error }]);
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

const appClosed = CommandResultFactory({ data: undefined });

function running(name: string) {
  return Promise.resolve(CommandResultFactory({ data: { name, version: "1.0.0" } }));
}

type DeviceAnswers = {
  app?(): Promise<unknown>;
  closeApp?(): Promise<unknown>;
  read?(): Promise<unknown>;
};

/**
 * A device on the dashboard that reads `onboardedDevice`, unless the test answers otherwise. Like a
 * real device, it answers after the command is sent, never during the call.
 */
function fakeDevice({
  app = () => running("BOLOS"),
  closeApp = () => Promise.resolve(appClosed),
  read = () => Promise.resolve(success(onboardedDevice)),
}: DeviceAnswers) {
  const answer = (command: object) => {
    if (command instanceof GetAppAndVersionCommand) return app();
    if (command instanceof CloseAppCommand) return closeApp();
    return read();
  };
  const sendCommand = jest.fn(({ command }) => Promise.resolve().then(() => answer(command)));

  return { dmk: createDeviceManagementKit({ sendCommand }), sendCommand };
}

function stateReads(sendCommand: jest.Mock): number {
  return commandNames(sendCommand).filter(name => name === "getOsVersion").length;
}

function start(dmk: DeviceManagementKit) {
  return runActor<ReadDeviceStateEvent>(readDeviceState, {
    dmk,
    sessionId: "session",
    retryPolicy: { ...createRetryPolicy(() => true), delaysMs: [0, 0] },
  });
}
