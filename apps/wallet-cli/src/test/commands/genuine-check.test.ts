import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Observable } from "rxjs";
import type { GetGenuineCheckFromDeviceIdResult } from "@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId";
import { runCli } from "../helpers/cli-runner";

let genuineCheckImpl: () => Observable<GetGenuineCheckFromDeviceIdResult>;

mock.module("@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId", () => ({
  getGenuineCheckFromDeviceId: () => genuineCheckImpl(),
}));

const MOCK_DMK_ENV = {
  WALLET_CLI_MOCK_DMK: "1",
};

// runCli executes in non-TTY mode (CLAUDECODE=1), so the spinner is disabled
// and intermediate device states surface as `device-state` NDJSON events
// instead of being swallowed by `spin.text = ...`. Tests parse stdout as a
// stream of JSON lines and look up events by content rather than position
// to stay decoupled from the exact event ordering.
function parseNdjson(stdout: string): Record<string, unknown>[] {
  return stdout
    .split("\n")
    .filter(line => line.length > 0)
    .map(line => JSON.parse(line) as Record<string, unknown>);
}

describe("genuine-check command (mock DMK)", () => {
  beforeEach(() => {
    genuineCheckImpl = () =>
      new Observable<GetGenuineCheckFromDeviceIdResult>(subscriber => {
        subscriber.next({ socketEvent: null, lockedDevice: false });
        subscriber.next({
          socketEvent: { type: "device-permission-requested" },
          lockedDevice: false,
        });
        subscriber.next({
          socketEvent: { type: "device-permission-granted" },
          lockedDevice: false,
        });
        subscriber.next({ socketEvent: { type: "result", payload: "0000" }, lockedDevice: false });
        subscriber.complete();
      });
  });

  it("reports a genuine device through the json envelope", async () => {
    const { stdout, stderr, exitCode } = await runCli(
      ["genuine-check", "--output", "json"],
      MOCK_DMK_ENV,
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const lines = parseNdjson(stdout);

    // The final envelope is the public success contract: status, command,
    // network and a `genuine: true` flag.
    expect(lines.at(-1)).toMatchObject({
      status: "success",
      command: "genuine-check",
      network: "device",
      genuine: true,
    });

    // While the run is in progress, the JSON consumer must be able to learn
    // that the device is awaiting user approval to open the manager.
    expect(lines).toContainEqual(
      expect.objectContaining({
        type: "device-state",
        command: "genuine-check",
        state: { code: "awaiting_approval", reason: "open_app" },
      }),
    );
  });

  it("surfaces a locked device through a device-state event without aborting the run", async () => {
    genuineCheckImpl = () =>
      new Observable<GetGenuineCheckFromDeviceIdResult>(subscriber => {
        subscriber.next({ socketEvent: null, lockedDevice: true });
        subscriber.next({ socketEvent: null, lockedDevice: false });
        subscriber.next({ socketEvent: { type: "result", payload: "0000" }, lockedDevice: false });
        subscriber.complete();
      });

    const { stdout, stderr, exitCode } = await runCli(
      ["genuine-check", "--output", "json"],
      MOCK_DMK_ENV,
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const lines = parseNdjson(stdout);

    expect(lines).toContainEqual(
      expect.objectContaining({
        type: "device-state",
        command: "genuine-check",
        state: { code: "awaiting_approval", reason: "unlock" },
      }),
    );
    expect(lines.at(-1)).toMatchObject({ status: "success", genuine: true });
  });

  it("fails with a timeout when the genuine check stops making progress", async () => {
    genuineCheckImpl = () => new Observable<GetGenuineCheckFromDeviceIdResult>(() => undefined);

    const { stdout, exitCode } = await runCli(
      ["genuine-check", "--output", "json", "--device-timeout", "1"],
      MOCK_DMK_ENV,
    );

    expect(exitCode).toBe(6);
    const lastLine = parseNdjson(stdout).at(-1);
    expect(lastLine).toMatchObject({
      ok: false,
      error: {
        command: "genuine-check",
        code: "timeout",
      },
    });
  });

  it("fails when the device returns a non-genuine result", async () => {
    genuineCheckImpl = () =>
      new Observable<GetGenuineCheckFromDeviceIdResult>(subscriber => {
        subscriber.next({ socketEvent: { type: "result", payload: "ffff" }, lockedDevice: false });
        subscriber.complete();
      });

    const { stdout, exitCode } = await runCli(["genuine-check", "--output", "json"], MOCK_DMK_ENV);

    expect(exitCode).toBe(1);
    const lastLine = parseNdjson(stdout).at(-1);
    expect(lastLine).toMatchObject({
      ok: false,
      error: {
        command: "genuine-check",
        message: "Device is not genuine.",
      },
    });
  });

  it("fails when the stream completes without a result event", async () => {
    genuineCheckImpl = () =>
      new Observable<GetGenuineCheckFromDeviceIdResult>(subscriber => {
        subscriber.next({
          socketEvent: { type: "device-permission-granted" },
          lockedDevice: false,
        });
        subscriber.complete();
      });

    const { stdout, exitCode } = await runCli(["genuine-check", "--output", "json"], MOCK_DMK_ENV);

    expect(exitCode).toBe(1);
    const lastLine = parseNdjson(stdout).at(-1);
    expect(lastLine).toMatchObject({
      ok: false,
      error: { command: "genuine-check" },
    });
  });
});
