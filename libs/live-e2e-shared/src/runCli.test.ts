import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runCliCommand } from "./runCli";

const isRunning = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const waitForFile = async (file: string) => {
  while (!existsSync(file)) await new Promise(resolve => setTimeout(resolve, 10));
};

test(
  "kills the CLI when its signal aborts, and settles once it has exited",
  { timeout: 10_000 },
  async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "run-cli-"));
    const pidFile = path.join(dir, "pid");
    const cliBin = path.join(dir, "hangingCli.js");
    writeFileSync(
      cliBin,
      `const fs = require("node:fs");
fs.writeFileSync(${JSON.stringify(`${pidFile}.tmp`)}, String(process.pid));
fs.renameSync(${JSON.stringify(`${pidFile}.tmp`)}, ${JSON.stringify(pidFile)});
setInterval(() => {}, 1_000);
`,
    );
    const originalCliBin = process.env.LEDGER_LIVE_CLI_BIN;
    process.env.LEDGER_LIVE_CLI_BIN = cliBin;

    try {
      const cli = new AbortController();
      const result = runCliCommand("tokenApproval", cli.signal);
      await waitForFile(pidFile);
      const pid = Number(readFileSync(pidFile, "utf8"));

      cli.abort();

      await assert.rejects(result, /Exit Code: null/);
      assert.equal(isRunning(pid), false);
    } finally {
      if (originalCliBin === undefined) Reflect.deleteProperty(process.env, "LEDGER_LIVE_CLI_BIN");
      else process.env.LEDGER_LIVE_CLI_BIN = originalCliBin;
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
