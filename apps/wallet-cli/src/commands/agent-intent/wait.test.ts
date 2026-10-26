import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { CliProcessExitError } from "../../cli-process-exit-error";
import { createCommandOutput } from "../../output";
import { installOutputCapture } from "../../shared/ui";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
} from "./__test-helpers__/agent-intent-mocks";

type Profile = Record<string, unknown>;

/** What each successive `Session.read` returns for the profile; the last entry repeats. */
let profileReads: Array<Profile | undefined>;
let sessionReadCalls: number;
/** Runs inside the first `Session.read`, before it returns. */
let onFirstSessionRead: () => Promise<void>;

beforeAll(() =>
  activateAgentIntentMocks({
    sessionRead: async () => {
      if (sessionReadCalls === 0) await onFirstSessionRead();
      const profile = profileReads[Math.min(sessionReadCalls, profileReads.length - 1)];
      sessionReadCalls++;
      return { getAgentIntentProfile: (_profileId: string) => profile };
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

let stateHome: string;
let savedStateHome: string | undefined;
beforeAll(() => {
  savedStateHome = process.env.XDG_STATE_HOME;
  stateHome = mkdtempSync(join(tmpdir(), "wallet-cli-wait-test-"));
  process.env.XDG_STATE_HOME = stateHome;
});
afterAll(() => {
  if (savedStateHome === undefined) delete process.env.XDG_STATE_HOME;
  else process.env.XDG_STATE_HOME = savedStateHome;
  rmSync(stateHome, { recursive: true, force: true });
});

const { default: waitCommand, pollEnrollment } = await import("./wait");
const { enrollListenerPaths, withEnrollListenerLock } = await import("../../agent-intent/detach");

// Resolved per test: XDG_STATE_HOME only points at the temp dir once `beforeAll` has run.
let logPath: string;
let lockPath: string;

function pendingProfile(expiresInMs = 30 * 60_000): Profile {
  return {
    profileId: "test-agent",
    environment: "production",
    enrollmentExpiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  };
}

const ENROLLED: Profile = {
  ...pendingProfile(),
  trustchainId: "app18-root",
  accountAccess: { environment: "production" },
};

function writeLog(lines: string[]): void {
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, lines.map(line => `${line}\n`).join(""));
}

function runWait(flags: { timeout?: string; output?: "human" | "json" } = {}) {
  return (
    waitCommand as unknown as {
      handler: (args: { flags: Record<string, unknown> }) => Promise<void>;
    }
  ).handler({ flags: { profile: "test-agent", timeout: "25s", ...flags } });
}

/** Runs the polling loop the handler runs, with a 10 ms interval, so polling tests do not sleep. */
function pollWait(timeoutMs = 25_000, format: "human" | "json" = "json") {
  const out = createCommandOutput(format, { command: "agent-intent wait", network: "all" });
  return out.run(() => pollEnrollment(out, "test-agent", { timeoutMs, intervalMs: 10 }));
}

/** Runs `run` to completion, returning its exit code and its single JSON output line. */
async function jsonResult(
  stdout: string[],
  run: () => Promise<void>,
): Promise<{ code: number; line: Record<string, unknown> }> {
  let code = 0;
  try {
    await run();
  } catch (e) {
    if (!(e instanceof CliProcessExitError)) throw e;
    code = e.code;
  }
  const lines = stdout.join("").trim().split("\n");
  expect(lines).toHaveLength(1);
  return { code, line: JSON.parse(lines[0]) };
}

/** Runs `wait --output json` through its handler. */
function runWaitJson(stdout: string[], flags: { timeout?: string } = {}) {
  return jsonResult(stdout, () => runWait({ ...flags, output: "json" }));
}

function pollWaitJson(stdout: string[], timeoutMs?: number) {
  return jsonResult(stdout, () => pollWait(timeoutMs));
}

describe("agent-intent wait", () => {
  let restore: () => void;
  let stdout: string[];

  beforeEach(() => {
    ({ logPath, lockPath } = enrollListenerPaths("test-agent"));
    expect(logPath.startsWith(stateHome)).toBe(true);
    profileReads = [pendingProfile()];
    sessionReadCalls = 0;
    onFirstSessionRead = async () => {};
    rmSync(dirname(logPath), { recursive: true, force: true });
    stdout = [];
    restore = installOutputCapture({ stdout: s => stdout.push(s), stderr: () => {} });
  });

  afterEach(() => restore());

  it("reports enrolled with the same envelope as enroll, exit 0", async () => {
    profileReads = [{ ...ENROLLED, keyStore: "plaintext-file" }];

    const { code, line } = await runWaitJson(stdout);

    expect(code).toBe(0);
    expect(line).toMatchObject({
      status: "success",
      command: "agent-intent wait",
      profileId: "test-agent",
      trustchainId: "app18-root",
      accountAccessEnvironment: "production",
      keyStore: "plaintext-file",
      enrolled: true,
    });
  });

  it("reports a profile with a recovery in flight as enrolled", async () => {
    profileReads = [
      { ...ENROLLED, pendingRecovery: { expiresAt: new Date(Date.now() + 60_000).toISOString() } },
    ];

    const { code, line } = await runWaitJson(stdout);

    expect(code).toBe(0);
    expect(line).toMatchObject({ enrolled: true, trustchainId: "app18-root" });
  });

  it("keeps polling a pending profile and reports enrolled once the listener saved it", async () => {
    profileReads = [pendingProfile(), ENROLLED];

    await withEnrollListenerLock("test-agent", async () => {
      const { code, line } = await pollWaitJson(stdout);

      expect(code).toBe(0);
      expect(line).toMatchObject({ enrolled: true });
    });
    expect(sessionReadCalls).toBe(2);
  });

  it("reads the lock before the session, so a listener that saves and exits in between reads enrolled", async () => {
    mkdirSync(dirname(lockPath), { recursive: true });
    const holder = Bun.spawn([process.execPath, "-e", "setInterval(() => {}, 1000)"]);
    writeFileSync(lockPath, `${holder.pid}:a1b2c3d4e5f60718`);
    // The listener saves the approval and exits after this run read its lock, before the session.
    onFirstSessionRead = async () => {
      holder.kill();
      await holder.exited;
    };
    profileReads = [pendingProfile(), ENROLLED];

    const { code, line } = await pollWaitJson(stdout);

    expect(code).toBe(0);
    expect(line).toMatchObject({ enrolled: true });
  });

  it("reports enrollment-waiting with the listener and the logged link at timeout, exit 0", async () => {
    const profile = pendingProfile();
    profileReads = [profile];
    writeLog([
      "a banner on stderr",
      JSON.stringify({
        type: "enrollment-pending",
        profileId: "test-agent",
        enrollmentUrl: "https://agent.example.com#request=opaque",
        fingerprint: "AB12",
        expiresAt: profile.enrollmentExpiresAt,
      }),
    ]);

    await withEnrollListenerLock("test-agent", async () => {
      const { code, line } = await pollWaitJson(stdout, 50);

      expect(code).toBe(0);
      expect(line).toEqual({
        type: "enrollment-waiting",
        command: "agent-intent wait",
        network: "all",
        profileId: "test-agent",
        expiresAt: profile.enrollmentExpiresAt,
        listenerPid: process.pid,
        enrollmentUrl: "https://agent.example.com#request=opaque",
      });
    });
  });

  it("omits the link from enrollment-waiting when the log no longer has it", async () => {
    await withEnrollListenerLock("test-agent", async () => {
      const { line } = await pollWaitJson(stdout, 50);

      expect(line.type).toBe("enrollment-waiting");
      expect(line).not.toHaveProperty("enrollmentUrl");
    });
  });

  it("tells a human how to keep waiting at timeout", async () => {
    await withEnrollListenerLock("test-agent", async () => {
      await runWait({ timeout: "1s" });
    });

    const text = stdout.join("");
    expect(text).toContain(`Profile "test-agent" is still pending`);
    expect(text).toContain(`(pid ${process.pid})`);
    expect(text).toContain("`wallet-cli agent-intent wait --profile test-agent` again");
  });

  it("fails with listener_exited and the listener's last logged error when no listener runs", async () => {
    writeLog([
      JSON.stringify({ ok: false, error: { message: "first error" } }),
      "a crash trace",
      JSON.stringify({
        ok: false,
        error: { message: "Enrollment did not complete (relay closed)." },
      }),
    ]);

    const { code, line } = await runWaitJson(stdout);

    expect(code).toBe(1);
    expect(line).toMatchObject({
      ok: false,
      error: {
        command: "agent-intent wait",
        code: "listener_exited",
        message: expect.stringContaining(
          "(last error: Enrollment did not complete (relay closed).)",
        ),
      },
    });
  });

  it("fails with listener_exited when the lock names a dead process", async () => {
    mkdirSync(dirname(lockPath), { recursive: true });
    const dead = Bun.spawnSync([process.execPath, "-e", ""]).pid;
    writeFileSync(lockPath, `${dead}:a1b2c3d4e5f60718`);

    const { code, line } = await runWaitJson(stdout);

    expect(code).toBe(1);
    expect(line).toMatchObject({ error: { code: "listener_exited" } });
  });

  it("fails with enrollment_expired once the link expired and no listener runs", async () => {
    profileReads = [pendingProfile(-1_000)];

    const { code, line } = await runWaitJson(stdout);

    expect(code).toBe(1);
    expect(line).toMatchObject({
      error: { code: "enrollment_expired", message: expect.stringContaining("expired at") },
    });
  });

  it("keeps polling an expired link while its listener runs, and reports enrollment-waiting at --timeout", async () => {
    const profile = pendingProfile(-1_000);
    profileReads = [profile];

    await withEnrollListenerLock("test-agent", async () => {
      const started = Date.now();
      const { code, line } = await pollWaitJson(stdout, 100);

      expect(Date.now() - started).toBeGreaterThanOrEqual(90);
      expect(code).toBe(0);
      expect(line).toMatchObject({
        type: "enrollment-waiting",
        expiresAt: profile.enrollmentExpiresAt,
        listenerPid: process.pid,
      });
    });
  });

  it("fails with enrollment_expired when the lock still names a live pid long after expiry", async () => {
    // A listener killed without cleanup leaves its pid in the lock, and the OS may reuse it.
    profileReads = [pendingProfile(-2 * 60_000)];

    await withEnrollListenerLock("test-agent", async () => {
      const { code, line } = await runWaitJson(stdout);

      expect(code).toBe(1);
      expect(line).toMatchObject({ error: { code: "enrollment_expired" } });
    });
  });

  it("reports enrolled when an approval made near expiry is saved after the link expired", async () => {
    profileReads = [pendingProfile(-1_000), ENROLLED];

    await withEnrollListenerLock("test-agent", async () => {
      const { code, line } = await pollWaitJson(stdout);

      expect(code).toBe(0);
      expect(line).toMatchObject({ enrolled: true });
    });
  });

  it("keeps polling while a live listener has not saved its profile yet", async () => {
    profileReads = [undefined, undefined, ENROLLED];

    await withEnrollListenerLock("test-agent", async () => {
      const { code, line } = await pollWaitJson(stdout);

      expect(code).toBe(0);
      expect(line).toMatchObject({ enrolled: true });
    });
    expect(sessionReadCalls).toBe(3);
  });

  it("fails with profile_not_found at --timeout when a live listener never saves its profile", async () => {
    profileReads = [undefined];

    await withEnrollListenerLock("test-agent", async () => {
      const started = Date.now();
      const { code, line } = await pollWaitJson(stdout, 100);

      expect(Date.now() - started).toBeGreaterThanOrEqual(90);
      expect(code).toBe(1);
      expect(line).toMatchObject({ error: { code: "profile_not_found" } });
    });
  });

  it("fails with profile_not_found for an unknown profile with no listener", async () => {
    profileReads = [undefined];

    const { code, line } = await runWaitJson(stdout);

    expect(code).toBe(1);
    expect(line).toMatchObject({
      error: { code: "profile_not_found", message: expect.stringContaining('"test-agent"') },
    });
  });

  it("rejects an invalid --timeout", async () => {
    await expect(runWait({ timeout: "soon" })).rejects.toThrow(/--timeout "soon" is invalid/);
  });
});
