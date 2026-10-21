import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readLiveLockHolderPid } from "../shared/file-lock";
import {
  enrollListenerPaths,
  readFirstLogJsonLine,
  readLogJsonLines,
  selfCommand,
  spawnDetached,
  withEnrollListenerLock,
} from "./detach";

const isPosix = process.platform !== "win32";

let stateHome: string;
let savedStateHome: string | undefined;
let children: ChildProcess[];

beforeEach(() => {
  savedStateHome = process.env.XDG_STATE_HOME;
  stateHome = mkdtempSync(join(tmpdir(), "wallet-cli-detach-test-"));
  process.env.XDG_STATE_HOME = stateHome;
  children = [];
});

afterEach(() => {
  for (const child of children) child.kill();
  if (savedStateHome === undefined) delete process.env.XDG_STATE_HOME;
  else process.env.XDG_STATE_HOME = savedStateHome;
  rmSync(stateHome, { recursive: true, force: true });
});

/** A real child process running `script` under this test's own Bun. */
function startChild(script: string, logPath: string): ChildProcess {
  const child = spawnDetached([process.execPath, "-e", script], logPath);
  children.push(child);
  return child;
}

describe("enrollListenerPaths", () => {
  it.skipIf(!isPosix)("puts the log and lock under the CLI state dir", () => {
    expect(enrollListenerPaths("my-agent")).toEqual({
      logPath: join(stateHome, "ledger-wallet-cli", "agent-intent-enroll", "my-agent.log"),
      lockPath: join(stateHome, "ledger-wallet-cli", "agent-intent-enroll", "my-agent.lock"),
    });
  });
});

describe("withEnrollListenerLock", () => {
  it("holds the profile's lock while fn runs and releases it after", async () => {
    const { lockPath } = enrollListenerPaths("my-agent");

    const holder = await withEnrollListenerLock("my-agent", async () =>
      readLiveLockHolderPid(lockPath),
    );

    expect(holder).toBe(process.pid);
    expect(readLiveLockHolderPid(lockPath)).toBeUndefined();
  });

  it.skipIf(!isPosix)("creates the listener dir 0700 and the lock file 0600", async () => {
    const { lockPath } = enrollListenerPaths("my-agent");

    const lockMode = await withEnrollListenerLock("my-agent", async () => statSync(lockPath).mode);

    expect(statSync(join(lockPath, "..")).mode & 0o777).toBe(0o700);
    expect(lockMode & 0o777).toBe(0o600);
  });

  it("fails fast when another live process is the profile's listener", async () => {
    const { lockPath } = enrollListenerPaths("my-agent");
    await withEnrollListenerLock("other", async () => {}); // creates the dir
    const holder = Bun.spawn([process.execPath, "-e", "await new Promise(() => {})"]);
    writeFileSync(lockPath, `${holder.pid}:a1b2c3d4e5f60718`);
    try {
      const started = Date.now();
      await expect(withEnrollListenerLock("my-agent", async () => "ran")).rejects.toThrow(
        /Timed out waiting for a lock/,
      );
      expect(Date.now() - started).toBeLessThan(5_000);
    } finally {
      holder.kill();
    }
  });
});

describe("selfCommand", () => {
  let savedArgv1: string | undefined;
  beforeEach(() => {
    savedArgv1 = process.argv[1];
  });
  afterEach(() => {
    process.argv[1] = savedArgv1 ?? "";
  });

  it("re-runs the script through the runtime in dev", () => {
    process.argv[1] = "/repo/apps/wallet-cli/src/cli.ts";

    expect(selfCommand(["agent-intent", "enroll"])).toEqual([
      process.execPath,
      "/repo/apps/wallet-cli/src/cli.ts",
      "agent-intent",
      "enroll",
    ]);
  });

  it("re-runs the binary alone when compiled", () => {
    process.argv[1] = "/$bunfs/root/wallet-cli";

    expect(selfCommand(["agent-intent", "enroll"])).toEqual([
      process.execPath,
      "agent-intent",
      "enroll",
    ]);
  });
});

describe("readLogJsonLines", () => {
  it("returns complete JSON object lines only, skipping text and a trailing partial line", () => {
    const logPath = join(stateHome, "test.log");
    writeFileSync(logPath, 'banner text\n{"a":1}\n[1]\n"str"\n{"b":2}\n{"partial":');

    expect(readLogJsonLines(logPath)).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("reads a missing log as empty", () => {
    expect(readLogJsonLines(join(stateHome, "missing.log"))).toEqual([]);
  });
});

describe("spawnDetached + readFirstLogJsonLine", () => {
  it("returns the child's first JSON line while the child keeps running", async () => {
    const { logPath } = enrollListenerPaths("my-agent");
    const child = startChild(
      'console.error("a banner on stderr");' +
        'console.log(JSON.stringify({ type: "enrollment-pending", profileId: "my-agent" }));' +
        "setInterval(() => {}, 1000);",
      logPath,
    );

    const first = await readFirstLogJsonLine(child, logPath, 10_000);

    expect(first).toEqual({ type: "enrollment-pending", profileId: "my-agent" });
    expect(child.exitCode).toBeNull();
    expect(() => process.kill(child.pid!, 0)).not.toThrow();
  });

  it.skipIf(!isPosix)("writes the log 0600, even over an existing looser one", async () => {
    const { logPath } = enrollListenerPaths("my-agent");
    await withEnrollListenerLock("my-agent", async () => {}); // creates the dir
    writeFileSync(logPath, "old run\n", { mode: 0o644 });
    const child = startChild('console.log("{}")', logPath);

    await readFirstLogJsonLine(child, logPath, 10_000);

    expect(statSync(logPath).mode & 0o777).toBe(0o600);
  });

  it("returns an error envelope the child printed before exiting", async () => {
    const { logPath } = enrollListenerPaths("my-agent");
    const child = startChild(
      'console.log(JSON.stringify({ ok: false, error: { message: "boom" } })); process.exit(1);',
      logPath,
    );

    expect(await readFirstLogJsonLine(child, logPath, 10_000)).toEqual({
      ok: false,
      error: { message: "boom" },
    });
  });

  it("fails when the child exits without printing a JSON line", async () => {
    const { logPath } = enrollListenerPaths("my-agent");
    const child = startChild('console.error("crashed"); process.exit(3);', logPath);

    await expect(readFirstLogJsonLine(child, logPath, 10_000)).rejects.toThrow(
      `The enrollment listener exited with code 3 before printing anything. See ${logPath}.`,
    );
  });

  it("fails when the command cannot be started", async () => {
    const { logPath } = enrollListenerPaths("my-agent");
    const child = spawnDetached([join(stateHome, "no-such-binary")], logPath);

    await expect(readFirstLogJsonLine(child, logPath, 10_000)).rejects.toThrow(
      /The enrollment listener could not start/,
    );
  });

  it("stops a child that prints nothing before the startup timeout", async () => {
    const { logPath } = enrollListenerPaths("my-agent");
    const child = startChild("setInterval(() => {}, 1000);", logPath);
    const exited = new Promise(resolve => child.once("exit", resolve));

    await expect(readFirstLogJsonLine(child, logPath, 300)).rejects.toThrow(
      /printed nothing within 0.3s and was stopped/,
    );
    await exited;
  });
});
