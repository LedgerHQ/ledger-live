import { CommandResultFactory, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { runActor } from "../tests/actorHarness";
import { createFakeCommandDmk, type ScriptedCommand } from "../tests/fakeDmk";
import { createOsVersionResponse, type OsVersionResponseOptions } from "../tests/osVersionResponse";
import { OnboardingStep } from "../types";
import { defaultSeedPollingIntervalMs, seedPolling, type SeedPollingEvent } from "./seedPolling";

const restoringWord = (currentWordIndex: number): OsVersionResponseOptions => ({
  onboardingState: "restore-recovery-phrase",
  numberOfWords: 24,
  currentWordIndex,
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("seedPolling", () => {
  it("reports the state read on the first poll", async () => {
    const { dmk } = createFakeCommandDmk([reads(restoringWord(0))]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(0);

    expect(received).toEqual([
      {
        type: "STEP_CHANGED",
        state: {
          isOnboarded: false,
          isInRecoveryMode: false,
          managerAllowed: false,
          currentOnboardingStep: OnboardingStep.RestoreSeed,
          seedWordIndex: 0,
          seedPhraseWordCount: 24,
        },
      },
    ]);
    stop();
  });

  it("polls again after a second", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([reads(restoringWord(0))]);
    const { stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(0);
    expect(sendCommand).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(defaultSeedPollingIntervalMs);
    expect(sendCommand).toHaveBeenCalledTimes(2);
    stop();
  });

  it("stays quiet while the state does not change", async () => {
    const { dmk } = createFakeCommandDmk([reads(restoringWord(3))]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(3 * defaultSeedPollingIntervalMs);

    expect(received).toHaveLength(1);
    stop();
  });

  it("reports each step the user reaches", async () => {
    const { dmk } = createFakeCommandDmk([
      reads(restoringWord(0)),
      reads(restoringWord(1)),
      reads({ onboardingState: "device-is-ready", numberOfWords: 24, currentWordIndex: 23 }),
    ]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(3 * defaultSeedPollingIntervalMs);

    expect(received.map(event => event.type)).toEqual([
      "STEP_CHANGED",
      "STEP_CHANGED",
      "STEP_CHANGED",
    ]);
    expect(received.at(-1)).toMatchObject({
      state: { currentOnboardingStep: OnboardingStep.Ready, seedWordIndex: 23 },
    });
    stop();
  });

  it("stays quiet while the state cannot be decoded", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([reads({ isOnboarded: false })]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(3 * defaultSeedPollingIntervalMs);

    expect(received).toEqual([]);
    expect(sendCommand).toHaveBeenCalledTimes(4);
    stop();
  });

  it("absorbs the failures a device being set up is expected to produce", async () => {
    const { dmk } = createFakeCommandDmk([
      { throws: new Error("device is locked") },
      { throws: new Error("transport race") },
      reads(restoringWord(2)),
    ]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(3 * defaultSeedPollingIntervalMs);

    expect(received).toEqual([expect.objectContaining({ type: "STEP_CHANGED" })]);
    stop();
  });

  it("forgets the earlier failures once a poll answers", async () => {
    const { dmk } = createFakeCommandDmk([
      { throws: new Error("device is locked") },
      { throws: new Error("device is locked") },
      reads(restoringWord(2)),
      { throws: new Error("device is locked") },
      { throws: new Error("device is locked") },
      reads(restoringWord(3)),
    ]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(6 * defaultSeedPollingIntervalMs);

    expect(received.map(event => event.type)).toEqual(["STEP_CHANGED", "STEP_CHANGED"]);
    stop();
  });

  it("gives up on a run of consecutive failures", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([{ throws: new Error("disconnected") }]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(3 * defaultSeedPollingIntervalMs);

    expect(received).toEqual([{ type: "TRANSPORT_LOST" }]);
    expect(sendCommand).toHaveBeenCalledTimes(3);

    await jest.advanceTimersByTimeAsync(5 * defaultSeedPollingIntervalMs);

    expect(sendCommand).toHaveBeenCalledTimes(3);
    stop();
  });

  it("never has two commands in flight", async () => {
    const sendCommand = jest.fn(() => new Promise(() => {}));
    const dmk = { sendCommand } as unknown as DeviceManagementKit;
    const { stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(5 * defaultSeedPollingIntervalMs);

    expect(sendCommand).toHaveBeenCalledTimes(1);
    stop();
  });

  it("stops polling once the actor is stopped", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([reads(restoringWord(0))]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(0);
    stop();
    await jest.advanceTimersByTimeAsync(5 * defaultSeedPollingIntervalMs);

    expect(sendCommand).toHaveBeenCalledTimes(1);
    expect(received).toHaveLength(1);
  });
});

function reads(options: OsVersionResponseOptions): ScriptedCommand<unknown> {
  return CommandResultFactory({ data: createOsVersionResponse(options) });
}

function start(dmk: DeviceManagementKit) {
  return runActor<SeedPollingEvent>(seedPolling, {
    dmk,
    sessionId: "session",
    failureThreshold: 3,
  });
}
