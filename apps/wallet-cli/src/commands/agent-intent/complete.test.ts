import "../../live-common-setup";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { installOutputCapture } from "../../shared/ui";

const AGENT_ENROLLMENT_WITH_ACCOUNT_ACCESS_VERSION = 1;

let storedProfile: Record<string, unknown> | undefined;
let updateCalls: Array<{ profileId: string; patch: Record<string, unknown> }>;
let writeCalled: boolean;

// mock.module replaces the whole module namespace, and other modules (output.ts) import real
// exports like `APP_NAME` from session-store — spread the real module so only `Session` changes.
const realSessionStore = await import("../../session/session-store");
mock.module("../../session/session-store", () => ({
  ...realSessionStore,
  Session: {
    read: async () => ({
      getAgentIntentProfile: (_profileId: string) => storedProfile,
      updateAgentIntentProfile: (profileId: string, patch: Record<string, unknown>) => {
        updateCalls.push({ profileId, patch });
      },
      write: () => {
        writeCalled = true;
      },
    }),
  },
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
    ).rejects.toThrow(/for the production environment but profile "test-agent" was enrolled against staging/);
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

    expect(updateCalls).toEqual([
      { profileId: "test-agent", patch: { trustchainId: "tc-new" } },
    ]);
    expect(writeCalled).toBe(true);
  });

  it("completes a version without accountAccess without requiring an environment match", async () => {
    storedProfile = { ...enrolledPendingProfile, environment: "staging" };
    parseAgentEnrollmentCompletionMock.mockImplementationOnce(() => ({
      version: 0,
      trustchainId: "tc-new",
    }));

    await runComplete({ profile: "test-agent", payload: '{"trustchainId":"tc-new"}' });

    expect(updateCalls).toEqual([
      { profileId: "test-agent", patch: { trustchainId: "tc-new" } },
    ]);
    expect(writeCalled).toBe(true);
  });
});
