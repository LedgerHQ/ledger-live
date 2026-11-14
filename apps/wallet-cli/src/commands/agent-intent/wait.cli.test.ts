import { afterEach, beforeEach, describe, expect, it, setSystemTime, spyOn } from "bun:test";
import { mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { formatAgentPublicKeyFingerprint } from "@ledgerhq/agent-intent-sdk";
import { YAML } from "bun";
import { enrollListenerPaths, withEnrollListenerLock } from "../../agent-intent/detach";
import { Session } from "../../session/session-store";
import { makeEnrolledProfile, type EnrolledProfile } from "../../testing/agent-intent-service";
import { runCli } from "../../testing/cli-runner";
import { pointStateHomeAt } from "../../testing/state-home";
import { _setTestPollSleep } from "./wait";

const PROFILE = "bot";
type StoredSession = { agentIntentProfiles: Record<string, unknown>[] };
const LINK = "https://agent.example.com#request=opaque";

let fixture: EnrolledProfile;
let storedProfile: Record<string, unknown>;
let logPath: string;
let lockPath: string;
let listener: { release: () => Promise<void> } | undefined;
/** Each wait between two polls, in ms of the frozen clock. */
let sleeps: number[];
/** What the listener does during each wait between polls, in order. */
let betweenPolls: (() => unknown)[];

const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();

function inStateHome<T>(fn: () => T): T {
  const restore = pointStateHomeAt(fixture.env.XDG_STATE_HOME);
  try {
    return fn();
  } finally {
    restore();
  }
}

/** Writes the profile with `patch` to the session, as the listener saves it. */
function saveProfile(patch: Record<string, unknown> = {}): void {
  storedProfile = { ...storedProfile, ...patch };
  writeFileSync(fixture.sessionPath, YAML.stringify({ agentIntentProfiles: [storedProfile] }));
}

/** A session without the profile: its listener has not saved it yet. */
function dropProfile(): void {
  writeFileSync(fixture.sessionPath, YAML.stringify({ accounts: [] }));
}

const enrolled = () => saveProfile({ trustchainId: "tc-1" });

/** Holds the profile's listener lock in this process, as a running listener does. */
async function startListener(): Promise<void> {
  let acquired!: () => void;
  let release!: () => void;
  const isAcquired = new Promise<void>(resolve => (acquired = resolve));
  const held = inStateHome(() =>
    withEnrollListenerLock(PROFILE, () => {
      acquired();
      return new Promise<void>(resolve => (release = resolve));
    }),
  );
  await isAcquired;
  listener = {
    release: () => {
      listener = undefined;
      release();
      return held;
    },
  };
}

/** Writes the lock of a listener that died without releasing it. */
function leaveDeadListenerLock(): void {
  mkdirSync(dirname(lockPath), { recursive: true });
  const dead = Bun.spawnSync([process.execPath, "-e", ""]).pid;
  writeFileSync(lockPath, `${dead}:a1b2c3d4e5f60718`);
}

function lockTakenAgo(ms: number): void {
  const takenAt = (Date.now() - ms) / 1000;
  utimesSync(lockPath, takenAt, takenAt);
}

function writeLog(...lines: (string | object)[]): void {
  mkdirSync(dirname(logPath), { recursive: true });
  const text = lines.map(line => (typeof line === "string" ? line : JSON.stringify(line)));
  writeFileSync(logPath, text.map(line => `${line}\n`).join(""));
}

/** The listener's pending line for the enrollment expiring at `expiresAt`. */
function pendingLine(expiresAt = storedProfile.enrollmentExpiresAt, enrollmentUrl = LINK) {
  return {
    type: "enrollment-pending",
    profileId: PROFILE,
    enrollmentUrl,
    fingerprint: "AB12",
    expiresAt,
    keyStore: "os-keychain",
  };
}

const errorLine = (message: string, code?: string) => ({ ok: false, error: { code, message } });

function wait(...args: string[]) {
  return runCli(["agent-intent", "wait", "--profile", PROFILE, ...args], fixture.env);
}

async function waitJson(...args: string[]) {
  const run = await wait(...args, "--output", "json");
  return { ...run, json: JSON.parse(run.stdout) };
}

const slept = () => sleeps.reduce((total, ms) => total + ms, 0);

describe("agent-intent wait (CLI)", () => {
  beforeEach(async () => {
    // Frozen at the real time, so the lock file's mtime stays comparable to it.
    setSystemTime(new Date());
    sleeps = [];
    betweenPolls = [];
    _setTestPollSleep(async ms => {
      sleeps.push(ms);
      setSystemTime(new Date(Date.now() + ms));
      await betweenPolls.shift()?.();
    });
    fixture = await makeEnrolledProfile({
      profileId: PROFILE,
      profile: { trustchainId: undefined, enrollmentExpiresAt: isoIn(30 * 60_000) },
    });
    // `wait` reads local state only, never the agent key.
    fixture.keychain.readError = new Error("wait read the agent key");
    storedProfile = (YAML.parse(readFileSync(fixture.sessionPath, "utf8")) as StoredSession)
      .agentIntentProfiles[0];
    ({ logPath, lockPath } = inStateHome(() => enrollListenerPaths(PROFILE)));
  });
  afterEach(async () => {
    setSystemTime();
    _setTestPollSleep(null);
    await listener?.release();
    listener = undefined;
    fixture.cleanup();
  });

  it("reports enrolled with the same envelope as enroll, exit 0", async () => {
    saveProfile({ trustchainId: "tc-1", keyStore: "plaintext-file" });

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({
      status: "success",
      command: "agent-intent wait",
      profileId: PROFILE,
      trustchainId: "tc-1",
      accountAccessEnvironment: "staging",
      keyStore: "plaintext-file",
      enrolled: true,
    });
    expect(sleeps).toEqual([]);
  });

  it("reports a profile with a recovery in flight as enrolled", async () => {
    saveProfile({ trustchainId: "tc-1", pendingRecovery: { expiresAt: isoIn(60_000) } });

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({ enrolled: true, trustchainId: "tc-1" });
  });

  it("keeps polling a pending profile and reports enrolled once the listener saved it", async () => {
    await startListener();
    betweenPolls = [enrolled];

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({ enrolled: true });
    expect(sleeps).toEqual([2_000]);
  });

  it("reads the lock before the session, so a listener that saves and exits in between reads enrolled", async () => {
    await startListener();
    const realRead = Session.read.bind(Session);
    // The listener saves the approval and exits after this run read its lock and the session.
    const read = spyOn(Session, "read").mockImplementationOnce(async () => {
      const session = await realRead();
      enrolled();
      await listener?.release();
      return session;
    });

    try {
      const { json, exitCode } = await waitJson();

      expect(exitCode).toBe(0);
      expect(json).toMatchObject({ enrolled: true });
    } finally {
      read.mockRestore();
    }
  });

  it("reports enrollment-waiting with the listener, key store and logged link at --timeout, exit 0", async () => {
    saveProfile({ keyStore: "plaintext-file" });
    writeLog("a banner on stderr", { ...pendingLine(), keyStore: "plaintext-file" });
    await startListener();

    const { json, exitCode } = await waitJson("--timeout", "5s");

    expect(exitCode).toBe(0);
    expect(json).toEqual({
      type: "enrollment-waiting",
      command: "agent-intent wait",
      network: "all",
      profileId: PROFILE,
      expiresAt: storedProfile.enrollmentExpiresAt,
      fingerprint: formatAgentPublicKeyFingerprint(fixture.agent.publicKey),
      keyStore: "plaintext-file",
      listenerPid: process.pid,
      enrollmentUrl: LINK,
    });
  });

  it("waits the default 25s, polling every 2s, when the link was there from the start", async () => {
    writeLog(pendingLine());
    await startListener();

    const { json } = await waitJson();

    expect(json).toMatchObject({ type: "enrollment-waiting", enrollmentUrl: LINK });
    expect(slept()).toBe(25_000);
    expect(new Set(sleeps.slice(0, -1))).toEqual(new Set([2_000]));
  });

  it("stops waiting at the link's expiry when it comes before --timeout", async () => {
    saveProfile({ enrollmentExpiresAt: isoIn(3_000) });
    await startListener();

    const { json } = await waitJson("--timeout", "1m");

    expect(json).toMatchObject({ type: "enrollment-waiting" });
    expect(slept()).toBe(3_000);
  });

  it("omits the link from enrollment-waiting when the log no longer has it", async () => {
    await startListener();

    const { json } = await waitJson("--timeout", "1s");

    expect(json.type).toBe("enrollment-waiting");
    expect(json).not.toHaveProperty("enrollmentUrl");
  });

  it("omits a link the log kept from an earlier enrollment of a reused profile id", async () => {
    // A plain (not --detach) enroll holds the listener lock but leaves the previous log in place.
    writeLog(pendingLine("2026-01-01T00:00:00.000Z", "https://agent.example.com#request=stale"));
    await startListener();

    const { json } = await waitJson("--timeout", "1s");

    expect(json.type).toBe("enrollment-waiting");
    expect(json).not.toHaveProperty("enrollmentUrl");
  });

  it("reports enrollment-waiting with the link as soon as a listener still starting logs it", async () => {
    dropProfile();
    await startListener();
    betweenPolls = [
      () => {
        saveProfile();
        writeLog(pendingLine());
      },
    ];

    const { json, exitCode } = await waitJson("--timeout", "1m");

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({
      type: "enrollment-waiting",
      expiresAt: storedProfile.enrollmentExpiresAt,
      enrollmentUrl: LINK,
    });
    expect(sleeps).toEqual([2_000]);
  });

  it("reports enrollment-waiting with the link as soon as it follows the saved profile", async () => {
    await startListener();
    // The listener writes the session before its pending line.
    betweenPolls = [() => writeLog(pendingLine())];

    const { json } = await waitJson("--timeout", "1m");

    expect(json).toMatchObject({ type: "enrollment-waiting", enrollmentUrl: LINK });
    expect(sleeps).toEqual([2_000]);
  });

  it("tells a human how to keep waiting at --timeout", async () => {
    await startListener();

    const { stdout, exitCode } = await wait("--timeout", "1s");

    expect(exitCode).toBe(0);
    expect(stdout).toContain(`Profile "${PROFILE}" is still pending`);
    expect(stdout).toContain(`(pid ${process.pid})`);
    expect(stdout).toContain(
      `Public key fingerprint: ${formatAgentPublicKeyFingerprint(fixture.agent.publicKey)}`,
    );
    expect(stdout).toContain(`\`wallet-cli agent-intent wait --profile ${PROFILE}\` again`);
  });

  it("fails with listener_exited and the listener's last logged error when no listener runs", async () => {
    writeLog(
      pendingLine(),
      errorLine("first error"),
      "a crash trace",
      errorLine("Enrollment did not complete (relay closed)."),
    );

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json).toMatchObject({
      ok: false,
      error: { command: "agent-intent wait", code: "listener_exited" },
    });
    expect(json.error.message).toContain(
      "(last error: Enrollment did not complete (relay closed).)",
    );
    expect(json.error.message).toContain(`Log: ${logPath}.`);
  });

  it("quotes no error from a log an earlier enrollment of a reused profile id left", async () => {
    // A plain (not --detach) enroll leaves the log of an earlier --detach run in place.
    writeLog(pendingLine("2026-01-01T00:00:00.000Z"), errorLine("stale error"));

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json.error.code).toBe("listener_exited");
    expect(json.error.message).not.toContain("last error");
  });

  it("fails with listener_exited when the lock names a dead process", async () => {
    leaveDeadListenerLock();

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json.error.code).toBe("listener_exited");
  });

  it("fails with enrollment_expired once the link expired and no listener runs", async () => {
    saveProfile({ enrollmentExpiresAt: isoIn(-1_000) });

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json.error).toMatchObject({
      code: "enrollment_expired",
      message: expect.stringContaining("expired at"),
    });
  });

  it("keeps polling an expired link while its listener runs, and reports enrollment-waiting at --timeout", async () => {
    saveProfile({ enrollmentExpiresAt: isoIn(-1_000) });
    await startListener();

    const { json, exitCode } = await waitJson("--timeout", "5s");

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({
      type: "enrollment-waiting",
      expiresAt: storedProfile.enrollmentExpiresAt,
      listenerPid: process.pid,
    });
    expect(slept()).toBe(5_000);
  });

  it("fails with enrollment_expired when the lock still names a live pid long after expiry", async () => {
    // A listener killed without cleanup leaves its pid in the lock, and the OS may reuse it.
    saveProfile({ enrollmentExpiresAt: isoIn(-2 * 60_000) });
    await startListener();

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json.error.code).toBe("enrollment_expired");
  });

  it("reports enrolled when an approval made near expiry is saved after the link expired", async () => {
    saveProfile({ enrollmentExpiresAt: isoIn(-1_000) });
    await startListener();
    betweenPolls = [enrolled];

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({ enrolled: true });
  });

  it("keeps polling while a live listener has not saved its profile yet", async () => {
    dropProfile();
    await startListener();
    betweenPolls = [() => {}, enrolled];

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({ enrolled: true });
    expect(sleeps).toHaveLength(2);
  });

  it("reports enrollment-waiting without expiresAt or a link at --timeout while a live listener has not saved its profile", async () => {
    dropProfile();
    await startListener();

    const { json, exitCode } = await waitJson("--timeout", "5s");

    expect(exitCode).toBe(0);
    expect(json).toEqual({
      type: "enrollment-waiting",
      command: "agent-intent wait",
      network: "all",
      profileId: PROFILE,
      listenerPid: process.pid,
    });
    expect(slept()).toBe(5_000);
  });

  it("tells a human the listener is still starting at --timeout", async () => {
    dropProfile();
    await startListener();

    const { stdout } = await wait("--timeout", "1s");

    expect(stdout).toContain("is not saved yet");
    expect(stdout).toContain(`(pid ${process.pid})`);
    expect(stdout).toContain(`\`wallet-cli agent-intent wait --profile ${PROFILE}\` again`);
  });

  it("keeps waiting for a live listener still starting after minutes, e.g. at a keychain prompt", async () => {
    dropProfile();
    await startListener();
    lockTakenAgo(4 * 60_000);

    const { json, exitCode } = await waitJson("--timeout", "1s");

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({ type: "enrollment-waiting", listenerPid: process.pid });
  });

  it("fails with listener_stuck when a live listener has not saved its profile within 10 minutes", async () => {
    dropProfile();
    await startListener();
    lockTakenAgo(10 * 60_000 + 1_000);

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json.error).toMatchObject({
      code: "listener_stuck",
      message: expect.stringContaining(
        `listener (pid ${process.pid}) has not saved it within 10 minutes`,
      ),
    });
  });

  it("fails with the listener's own error once it logs one and exits before saving its profile", async () => {
    dropProfile();
    await startListener();
    // The human denies the keychain prompt: the listener logs its error and exits.
    betweenPolls = [
      () => {
        writeLog(
          "a banner on stderr",
          errorLine("The OS keychain refused the write.", "keychain_unavailable"),
        );
        return listener?.release();
      },
    ];

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json.error).toMatchObject({
      code: "keychain_unavailable",
      message: `The OS keychain refused the write. Log: ${logPath}.`,
    });
    expect(sleeps).toHaveLength(1);
  });

  it("fails with listener_exited when the listener logged an error without a code before saving its profile", async () => {
    dropProfile();
    writeLog(errorLine("Could not write the key file."));

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json.error).toMatchObject({
      code: "listener_exited",
      message: `Could not write the key file. Log: ${logPath}.`,
    });
  });

  it("fails with profile_not_found once a listener exits before saving its profile without logging an error", async () => {
    dropProfile();
    await startListener();
    betweenPolls = [() => listener?.release()];

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json.error.code).toBe("profile_not_found");
    expect(json.error.message).not.toContain("not saved");
    expect(sleeps).toHaveLength(1);
  });

  it("fails with profile_not_found when the log has an error after a pending line", async () => {
    // A profile removed after its enrollment: the error is about that enrollment, not a startup.
    dropProfile();
    writeLog(pendingLine("2026-01-01T00:00:00.000Z"), errorLine("boom", "some_code"));

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json.error.code).toBe("profile_not_found");
  });

  it("fails with profile_not_found for an unknown profile with no listener", async () => {
    dropProfile();

    const { json, exitCode } = await waitJson();

    expect(exitCode).toBe(1);
    expect(json.error).toMatchObject({
      code: "profile_not_found",
      message: expect.stringContaining(`"${PROFILE}"`),
    });
  });

  it("rejects an invalid --timeout", async () => {
    const { json, exitCode } = await waitJson("--timeout", "soon");

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/--timeout "soon" is invalid/);
  });
});
