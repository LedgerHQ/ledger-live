import path from "node:path";
import { describe, expect, it } from "bun:test";
import { DEVICE_EXIT_CODES } from "../../device/device-state";
import { WalletCliDeviceError } from "../../device/wallet-cli-device-error";

const ROOT = path.resolve(import.meta.dir, "../../..");
const HUMAN_DEVICE_ERROR_EXIT = path.resolve(
  import.meta.dir,
  "../helpers/human-device-error-exit.ts",
);

describe("output command handling", () => {
  it("human output exits with the WalletCliDeviceError exit code", async () => {
    const proc = Bun.spawn(["bun", "--cwd", ROOT, HUMAN_DEVICE_ERROR_EXIT], {
      env: {
        ...process.env,
        CLAUDECODE: "1",
        NO_COLOR: "1",
      },
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const stderr = await new Response(proc.stderr).text();

    expect(exitCode).toBe(DEVICE_EXIT_CODES.timeout);
    expect(stderr).toContain(
      new WalletCliDeviceError({ code: "timeout", likelyCause: "sandbox_blocking_usb" }).message,
    );
  });

  it("human output points at the JSON view and stays within 3 lines (LIVE-31394)", async () => {
    const proc = Bun.spawn(["bun", "--cwd", ROOT, HUMAN_DEVICE_ERROR_EXIT], {
      env: { ...process.env, CLAUDECODE: "1", NO_COLOR: "1" },
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });

    await proc.exited;
    const stderr = await new Response(proc.stderr).text();
    const lines = stderr
      .trimEnd()
      .split("\n")
      .filter(line => line.trim().length > 0);

    // The structured diagnosis is agent-oriented and long; the human gets a pointer, not the lot.
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(stderr).toContain("--output json");
    // The agent hint belongs in the JSON envelope only.
    expect(stderr).not.toContain("dangerouslyDisableSandbox");
  });
});
