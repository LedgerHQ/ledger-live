import "../../live-common-setup";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { installOutputCapture } from "../../shared/ui";

const AGENT_ENROLLMENT_WITH_ACCOUNT_ACCESS_VERSION = 1;

let storedProfile: Record<string, unknown> | undefined;
// Set only by the race test below: lets the precheck (1st Session.read) and the locked,
// authoritative recheck (2nd Session.read) see different state, the way a real concurrent
// enroll/complete would. Every other test leaves this undefined, so both reads see `storedProfile`.
let storedProfileOnRecheck: Record<string, unknown> | undefined | "same-as-precheck";
let updateCalls: Array<{ profileId: string; patch: Record<string, unknown> }>;
let writeCalled: boolean;
let sessionReadCalls: number;

// mock.module replaces the whole module namespace, and other modules (output.ts) import real
// exports like `APP_NAME` from session-store — spread the real module so only `Session` changes.
const realSessionStore = await import("../../session/session-store");
mock.module("../../session/session-store", () => ({
  ...realSessionStore,
  Session: {
    read: async () => {
      sessionReadCalls++;
      const profile =
        sessionReadCalls === 1 || storedProfileOnRecheck === "same-as-precheck"
          ? storedProfile
          : storedProfileOnRecheck;
      return {
        getAgentIntentProfile: (_profileId: string) => profile,
        updateAgentIntentProfile: (profileId: string, patch: Record<string, unknown>) => {
          updateCalls.push({ profileId, patch });
        },
        write: () => {
          writeCalled = true;
        },
      };
    },
  },
  // Real implementation calls mkdirSync + a real file lock — irrelevant to what these tests check,
  // so make it a no-op instead of exercising real file I/O.
  withSessionLock: async <T>(fn: () => Promise<T> | T) => fn(),
}));

// Also spread here: output.ts separately imports `formatAgentPublicKeyFingerprint` from this SDK.
const realAgentIntentSdk = await import("@ledgerhq/agent-intent-sdk");
const parseAgentEnrollmentCompletionMock = mock((payload: string, _publicKey: string) =>
  JSON.parse(payload),
);
mock.module("@ledgerhq/agent-intent-sdk", () => ({
  ...realAgentIntentSdk,
  parseAgentEnrollmentCompletion: parseAgentEnrollmentCompletionMock,
  AGENT_ENROLLMENT_WITH_ACCOUNT_ACCESS_VERSION,
}));

const { default: completeCommand } = await import("./complete");

function runComplete(flags: { profile: string; payload?: string; output?: "human" | "json" }) {
  return (
    completeCommand as unknown as {
      handler: (args: { flags: typeof flags }) => Promise<void>;
    }
  ).handler({ flags });
}

const enrolledPendingProfile = {
  profileId: "test-agent",
  publicKey: "0236cb7ebc1a324bd02abac533f7904f9579cc581c772285fecc6f5157a960b076",
  environment: "staging",
};

describe("agent-intent complete", () => {
  let restore: () => void;

  beforeEach(() => {
    storedProfile = undefined;
    storedProfileOnRecheck = "same-as-precheck";
    sessionReadCalls = 0;
    updateCalls = [];
    writeCalled = false;
    parseAgentEnrollmentCompletionMock.mockClear();
    restore = installOutputCapture({ stdout: () => {}, stderr: () => {} });
  });

  afterEach(() => restore());

  it("rejects a completion for a profile that isn't enrolled locally", async () => {
    storedProfile = undefined;

    await expect(
      runComplete({ profile: "test-agent", payload: '{"trustchainId":"tc-1"}' }),
    ).rejects.toThrow(/No Agent Intent profile named "test-agent"/);
    expect(writeCalled).toBe(false);
  });

  it("refuses to re-complete an already-enrolled profile", async () => {
    storedProfile = { ...enrolledPendingProfile, trustchainId: "tc-existing" };

    await expect(
      runComplete({ profile: "test-agent", payload: '{"trustchainId":"tc-1"}' }),
    ).rejects.toThrow(/already enrolled \(Trustchain ID: tc-existing\)/);
    expect(writeCalled).toBe(false);
  });

  it("rejects an empty completion payload", async () => {
    storedProfile = { ...enrolledPendingProfile };

    await expect(runComplete({ profile: "test-agent", payload: "  " })).rejects.toThrow(
      /Completion JSON is empty/,
    );
  });

  it("rejects a completion issued for a different environment than the profile was enrolled against", async () => {
    storedProfile = { ...enrolledPendingProfile, environment: "staging" };
    parseAgentEnrollmentCompletionMock.mockImplementationOnce(() => ({
      version: AGENT_ENROLLMENT_WITH_ACCOUNT_ACCESS_VERSION,
      trustchainId: "tc-1",
      accountAccess: { environment: "production" },
    }));

    await expect(
      runComplete({ profile: "test-agent", payload: '{"anything":"here"}' }),
    ).rejects.toThrow(
      /for the production environment but profile "test-agent" was enrolled against staging/,
    );
    expect(writeCalled).toBe(false);
    expect(updateCalls).toEqual([]);
  });

  it("propagates a malformed/invalid completion payload instead of silently enrolling", async () => {
    storedProfile = { ...enrolledPendingProfile };
    const parseError = new Error("signature does not match the enrolled public key");
    parseAgentEnrollmentCompletionMock.mockImplementationOnce(() => {
      throw parseError;
    });

    await expect(
      runComplete({ profile: "test-agent", payload: '{"trustchainId":"tc-1"}' }),
    ).rejects.toBe(parseError);
    expect(writeCalled).toBe(false);
  });

  it("saves the trustchain id and completes when the environment matches", async () => {
    storedProfile = { ...enrolledPendingProfile, environment: "staging" };
    parseAgentEnrollmentCompletionMock.mockImplementationOnce(() => ({
      version: AGENT_ENROLLMENT_WITH_ACCOUNT_ACCESS_VERSION,
      trustchainId: "tc-new",
      accountAccess: { environment: "staging" },
    }));

    await runComplete({ profile: "test-agent", payload: '{"anything":"here"}' });

    expect(updateCalls).toEqual([{ profileId: "test-agent", patch: { trustchainId: "tc-new" } }]);
    expect(writeCalled).toBe(true);
  });

  it("catches a concurrent completion at the locked recheck even though the precheck passed", async () => {
    // Simulates: the profile was still pending when this complete's fast precheck ran, but another
    // `complete` for the same profile won the race and landed first — by the time the lock is held
    // and the authoritative recheck runs, it's already enrolled. This is the exact race the
    // two-phase (precheck + locked recheck) design in complete.ts exists to catch; a mock returning
    // the same object twice could never disagree with itself and would make this untestable.
    storedProfile = { ...enrolledPendingProfile };
    storedProfileOnRecheck = {
      ...enrolledPendingProfile,
      trustchainId: "tc-from-the-other-process",
    };

    await expect(
      runComplete({ profile: "test-agent", payload: '{"trustchainId":"tc-1"}' }),
    ).rejects.toThrow(/already enrolled \(Trustchain ID: tc-from-the-other-process\)/);
    expect(writeCalled).toBe(false);
    expect(sessionReadCalls).toBe(2); // precheck + locked recheck, proving both actually ran
  });

  it("completes a version without accountAccess without requiring an environment match", async () => {
    storedProfile = { ...enrolledPendingProfile, environment: "staging" };
    parseAgentEnrollmentCompletionMock.mockImplementationOnce(() => ({
      version: 0,
      trustchainId: "tc-new",
    }));

    await runComplete({ profile: "test-agent", payload: '{"trustchainId":"tc-new"}' });

    expect(updateCalls).toEqual([{ profileId: "test-agent", patch: { trustchainId: "tc-new" } }]);
    expect(writeCalled).toBe(true);
  });
});
