import { CommandResultFactory, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { runActor } from "../tests/actorHarness";
import { createFakeCommandDmk } from "../tests/fakeDmk";
import { createOsVersionResponse } from "../tests/osVersionResponse";
import {
  defaultUnlockPollingIntervalMs,
  unlockPolling,
  type UnlockPollingEvent,
} from "./unlockPolling";

const answers = CommandResultFactory({ data: createOsVersionResponse({ isOnboarded: false }) });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("unlockPolling", () => {
  it("reports the unlock as soon as the device answers", async () => {
    const { dmk } = createFakeCommandDmk([answers]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(0);

    expect(received).toEqual([{ type: "UNLOCKED" }]);
    stop();
  });

  it("keeps polling while the device rejects the command", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([
      { throws: new Error("device is locked") },
      { throws: new Error("device is locked") },
      answers,
    ]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(0);
    expect(received).toEqual([]);

    await jest.advanceTimersByTimeAsync(2 * defaultUnlockPollingIntervalMs);

    expect(received).toEqual([{ type: "UNLOCKED" }]);
    expect(sendCommand).toHaveBeenCalledTimes(3);
    stop();
  });

  it("never gives up, however long the device stays locked", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([{ throws: new Error("device is locked") }]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(30 * defaultUnlockPollingIntervalMs);

    expect(received).toEqual([]);
    expect(sendCommand).toHaveBeenCalledTimes(31);
    stop();
  });

  it("stops polling once the device answered", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([answers]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(5 * defaultUnlockPollingIntervalMs);

    expect(received).toHaveLength(1);
    expect(sendCommand).toHaveBeenCalledTimes(1);
    stop();
  });

  it("never has two commands in flight", async () => {
    const sendCommand = jest.fn(() => new Promise(() => {}));
    const dmk = { sendCommand } as unknown as DeviceManagementKit;
    const { stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(5 * defaultUnlockPollingIntervalMs);

    expect(sendCommand).toHaveBeenCalledTimes(1);
    stop();
  });

  it("stops polling once the actor is stopped", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([{ throws: new Error("device is locked") }]);
    const { received, stop } = start(dmk);

    await jest.advanceTimersByTimeAsync(0);
    stop();
    await jest.advanceTimersByTimeAsync(5 * defaultUnlockPollingIntervalMs);

    expect(sendCommand).toHaveBeenCalledTimes(1);
    expect(received).toEqual([]);
  });
});

function start(dmk: DeviceManagementKit) {
  return runActor<UnlockPollingEvent>(unlockPolling, { dmk, sessionId: "session" });
}
