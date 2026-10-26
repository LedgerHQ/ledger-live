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
  readLogLinesBeforeFirstJson,
  selfCommand,
  spawnDetached,
  withEnrollListenerLock,
  withEnrollStartLock,
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
    const dir = join(stateHome, "ledger-wallet-cli", "agent-intent-enroll");
    expect(enrollListenerPaths("My-Agent")).toEqual({
      logPath: join(dir, "my-agent-b59f3481.log"),
      lockPath: join(dir, "my-agent-b59f3481.lock"),
    });
  });

  it("gives ids that differ only in case distinct files on a case-insensitive filesystem", async () => {
    const upper = enrollListenerPaths("Bot");
    const lower = enrollListenerPaths("bot");

    expect(upper.logPath.toLowerCase()).not.toBe(lower.logPath.toLowerCase());
    expect(upper.lockPath.toLowerCase()).not.toBe(lower.lockPath.toLowerCase());
    await withEnrollListenerLock("Bot", async () => {
      expect(await withEnrollListenerLock("bot", async () => "listening")).toBe("listening");
      expect(await withEnrollStartLock("bot", async () => "started")).toBe("started");
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

  it("fails at once, pointing at wait, when another live process is the profile's listener", async () => {
    const { lockPath } = enrollListenerPaths("my-agent");
    await withEnrollListenerLock("other", async () => {}); // creates the dir
    const holder = Bun.spawn([process.execPath, "-e", "await new Promise(() => {})"]);
    writeFileSync(lockPath, `${holder.pid}:a1b2c3d4e5f60718`);
    let ran = false;
    try {
      const started = Date.now();
      await expect(
        withEnrollListenerLock("my-agent", async () => {
          ran = true;
        }),
      ).rejects.toThrow(
        `An enrollment listener for profile "my-agent" is already running (pid ${holder.pid}). ` +
          "Run `wallet-cli agent-intent wait --profile my-agent` to check on it.",
      );
      expect(Date.now() - started).toBeLessThan(500);
      expect(ran).toBe(false);
    } finally {
      holder.kill();
    }
  });
});

describe("withEnrollStartLock", () => {
  it("does not share a lock file with the listener of profile <id>.start", async () => {
    await withEnrollListenerLock("bot.start", async () => {
      const started = Date.now();
      expect(await withEnrollStartLock("bot", async () => "started")).toBe("started");
      expect(Date.now() - started).toBeLessThan(500);
    });
    await withEnrollStartLock("bot", async () => {
      expect(await withEnrollListenerLock("bot.start", async () => "listening")).toBe("listening");
    });
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

describe("readLogLinesBeforeFirstJson", () => {
  it("returns the complete lines before the first JSON object line", () => {
    const logPath = join(stateHome, "test.log");
    writeFileSync(logPath, 'warn 1\nwarn 2\n{"a":1}\nafter\n');

    expect(readLogLinesBeforeFirstJson(logPath)).toEqual(["warn 1", "warn 2"]);
  });

  it("reads a missing log as empty", () => {
    expect(readLogLinesBeforeFirstJson(join(stateHome, "missing.log"))).toEqual([]);
  });
});

describe("spawnDetached + readFirstLogJsonLine", () => {
  it("returns the child's first JSON line while the child keeps running", async () => {
    const { logPath } = enrollListenerPaths("my-agent");
    const child = startChild(
      'process.stderr.write("a banner on stderr\\n");' +
        'console.log(JSON.stringify({ type: "enrollment-pending", profileId: "my-agent" }));' +
        "setInterval(() => {}, 1000);",
      logPath,
    );

    const first = await readFirstLogJsonLine(child, logPath, 10_000);

    expect(first).toEqual({ type: "enrollment-pending", profileId: "my-agent" });
    expect(readLogLinesBeforeFirstJson(logPath)).toEqual(["a banner on stderr"]);
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

  it("marks the child as a detached listener and keeps the rest of the env", async () => {
    const { logPath } = enrollListenerPaths("my-agent");
    const child = startChild(
      "console.log(JSON.stringify({ marker: process.env.WALLET_CLI_DETACHED_LISTENER, " +
        "stateHome: process.env.XDG_STATE_HOME }));",
      logPath,
    );

    expect(await readFirstLogJsonLine(child, logPath, 10_000)).toEqual({
      marker: "1",
      stateHome,
    });
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
      `The enrollment listener exited with code 3 before printing its first event. See ${logPath}.`,
    );
  });

  it("fails when the command cannot be started", async () => {
    const { logPath } = enrollListenerPaths("my-agent");
    const child = spawnDetached([join(stateHome, "no-such-binary")], logPath);

    await expect(readFirstLogJsonLine(child, logPath, 10_000)).rejects.toThrow(
      /The enrollment listener could not start/,
    );
  });

  it("returns undefined and leaves the child running when it prints nothing before the startup timeout", async () => {
    const { logPath } = enrollListenerPaths("my-agent");
    const child = startChild("setInterval(() => {}, 1000);", logPath);

    expect(await readFirstLogJsonLine(child, logPath, 300)).toBeUndefined();
    await Bun.sleep(100); // room for a stop signal to land
    expect(child.killed).toBe(false);
    expect(child.exitCode).toBeNull();
    expect(child.signalCode).toBeNull();
    expect(() => process.kill(child.pid!, 0)).not.toThrow();
  });
});
