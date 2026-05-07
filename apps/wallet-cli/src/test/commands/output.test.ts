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
    expect(exitCode).toBe(DEVICE_EXIT_CODES.timeout);
    expect(await new Response(proc.stderr).text()).toContain(
      new WalletCliDeviceError({ code: "timeout" }).message,
    );
  });
});
