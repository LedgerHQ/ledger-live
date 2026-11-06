import { execFile } from "node:child_process";
import path from "node:path";
import type { RunResult } from "./types.ts";

export const INSTALL_TIMEOUT_MS = 600_000;
// A query of a device's state: its processes, screen or clock.
export const DEVICE_QUERY_TIMEOUT_MS = 20_000;

export const log = (message: string): void =>
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** `file` resolved under the working directory, which is all the CLIs read or write. */
export function insideWorkingDir(file: string): string {
  const root = process.cwd();
  const resolved = path.resolve(root, file);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`${file} is outside the working directory ${root}`);
  }
  return resolved;
}

export interface RunOptions {
  timeoutMs?: number;
  allowFail?: boolean;
  env?: NodeJS.ProcessEnv;
}

export function run(
  cmd: string,
  args: string[],
  { timeoutMs = 120_000, allowFail = false, env }: RunOptions = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, ...(env ? { env } : {}) },
      (error, stdout, stderr) => {
        const result = { failed: !!error, stdout: String(stdout), stderr: String(stderr) };
        if (error && !allowFail) {
          const detail = (result.stderr || result.stdout || error.message).slice(-1500);
          reject(new Error(`${cmd} ${args.join(" ")} failed: ${detail}`));
        } else {
          resolve(result);
        }
      },
    );
  });
}
