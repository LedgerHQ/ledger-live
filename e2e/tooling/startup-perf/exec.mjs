import { execFile } from "node:child_process";

/** @import { RunResult } from "./types.mjs" */

export const INSTALL_TIMEOUT_MS = 600_000;
// A query of a device's state: its processes, screen or clock.
export const DEVICE_QUERY_TIMEOUT_MS = 20_000;

/** @param {string} message */
export const log = message => console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ timeoutMs?: number, allowFail?: boolean, env?: NodeJS.ProcessEnv }} [options]
 * @returns {Promise<RunResult>}
 */
export function run(cmd, args, { timeoutMs = 120_000, allowFail = false, env } = {}) {
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
