import "../../live-common-setup";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { installOutputCapture } from "../../shared/ui";

let existingProfile: { profileId: string } | undefined;
// Set only by the race test below: lets the precheck (1st Session.read) and the locked, authoritative
// recheck (2nd Session.read) see different state, the way a real concurrent enroll would — every
// other test leaves this undefined, so both reads keep seeing the same `existingProfile`.
let existingProfileOnRecheck: { profileId: string } | undefined | "same-as-precheck";
let keychainHasEntry: boolean;
let addAgentIntentProfileImpl: (profile: Record<string, unknown>) => void;
let writeImpl: () => void;
let sessionReadCalls: number;

const savedSecretKeys = new Set<string>();
const deletedSecretKeyCalls: string[] = [];

const realSessionStore = await import("../../session/session-store");
mock.module("../../session/session-store", () => ({
  ...realSessionStore,
  Session: {
    read: async () => {
      sessionReadCalls++;
      const profile =
        sessionReadCalls === 1 || existingProfileOnRecheck === "same-as-precheck"
          ? existingProfile
          : existingProfileOnRecheck;
      return {
        getAgentIntentProfile: (_profileId: string) => profile,
        addAgentIntentProfile: (profile: Record<string, unknown>) =>
          addAgentIntentProfileImpl(profile),
        write: () => writeImpl(),
      };
    },
  },
  // Real implementation calls mkdirSync + a real file lock — irrelevant to what these tests check
  // (the checks/rollback logic), so make it a no-op instead of exercising real file I/O.
  withSessionLock: async <T>(fn: () => Promise<T> | T) => fn(),
}));

mock.module("../../key-ring/agent-intent-keychain", () => ({
  hasAgentIntentSecretKey: (_profileId: string) => keychainHasEntry,
  saveAgentIntentSecretKey: async (profileId: string, _secretKeyHex: string) => {
    savedSecretKeys.add(profileId);
  },
  deleteAgentIntentSecretKey: (profileId: string) => {
    deletedSecretKeyCalls.push(profileId);
    savedSecretKeys.delete(profileId);
    return true;
  },
}));

const realAgentIntentSdk = await import("@ledgerhq/agent-intent-sdk");
mock.module("@ledgerhq/agent-intent-sdk", () => ({
  ...realAgentIntentSdk,
  createSoftwareAgentIdentity: () => ({
    publicKey: "0236cb7ebc1a324bd02abac533f7904f9579cc581c772285fecc6f5157a960b076",
    exportSecretKey: () => "deadbeef",
  }),
  createAgentEnrollmentRequest: () => ({ signedRequest: "opaque" }),
  createAgentEnrollmentUrl: (appUrl: string, _request: unknown) => `${appUrl}#request=opaque`,
}));

const { default: enrollCommand } = await import("./enroll");

type EnrollFlags = {
  profile: string;
  name: string;
  description: string;
  source: "openclaw";
  "app-url"?: string;
  "expires-in": string;
  environment: "staging" | "production";
  output?: "human" | "json";
};

function runEnroll(overrides: Partial<EnrollFlags> = {}) {
  const flags: EnrollFlags = {
    profile: "test-agent",
    name: "Test Agent",
    description: "Remote agent that proposes intents for review.",
    source: "openclaw",
    "expires-in": "30m",
    environment: "staging",
    ...overrides,
  };
  return (
    enrollCommand as unknown as { handler: (args: { flags: EnrollFlags }) => Promise<void> }
  ).handler({ flags });
}

describe("agent-intent enroll", () => {
  let restore: () => void;

  beforeEach(() => {
    existingProfile = undefined;
    existingProfileOnRecheck = "same-as-precheck";
    sessionReadCalls = 0;
    keychainHasEntry = false;
    savedSecretKeys.clear();
    deletedSecretKeyCalls.length = 0;
    addAgentIntentProfileImpl = () => {};
    writeImpl = () => {};
    restore = installOutputCapture({ stdout: () => {}, stderr: () => {} });
  });

  afterEach(() => restore());

  it("refuses to overwrite a profile id already recorded in the session", async () => {
    existingProfile = { profileId: "test-agent" };

    await expect(runEnroll()).rejects.toThrow(/already exists/);
    expect(savedSecretKeys.has("test-agent")).toBe(false);
  });

  it("refuses to enroll when a keychain entry already exists but isn't recorded in the session", async () => {
    keychainHasEntry = true;

    await expect(runEnroll()).rejects.toThrow(
      /keychain entry for profile "test-agent" already exists/,
    );
  });

  it("rejects an invalid --expires-in before touching the keychain or session", async () => {
    await expect(runEnroll({ "expires-in": "not-a-duration" })).rejects.toThrow(
      /--expires-in "not-a-duration" is invalid/,
    );
    expect(savedSecretKeys.size).toBe(0);
    expect(sessionReadCalls).toBe(0);
  });

  it("rejects an --expires-in beyond the 30 day maximum", async () => {
    await expect(runEnroll({ "expires-in": "31d" })).rejects.toThrow(/maximum is 30d/);
  });

  it("rolls back the keychain entry when the session write fails after the keychain write succeeded", async () => {
    const sessionError = new Error("disk full");
    writeImpl = () => {
      throw sessionError;
    };

    await expect(runEnroll()).rejects.toBe(sessionError);

    expect(savedSecretKeys.has("test-agent")).toBe(false);
    expect(deletedSecretKeyCalls).toEqual(["test-agent"]);
  });

  it("rolls back the keychain entry when addAgentIntentProfile itself throws", async () => {
    const addError = new Error("duplicate profileId race");
    addAgentIntentProfileImpl = () => {
      throw addError;
    };

    await expect(runEnroll()).rejects.toBe(addError);

    expect(savedSecretKeys.has("test-agent")).toBe(false);
    expect(deletedSecretKeyCalls).toEqual(["test-agent"]);
  });

  it("does not roll back the keychain entry on a successful enrollment", async () => {
    let persistedProfile: Record<string, unknown> | undefined;
    addAgentIntentProfileImpl = profile => {
      persistedProfile = profile;
    };

    await runEnroll();

    expect(savedSecretKeys.has("test-agent")).toBe(true);
    expect(deletedSecretKeyCalls).toEqual([]);
    expect(persistedProfile).toMatchObject({
      profileId: "test-agent",
      displayName: "Test Agent",
      environment: "staging",
      bffBaseUrl: "https://global.api.stg.ledger-test.com/agent-intent",
    });
  });

  it("catches a same-profile race at the locked recheck even though the precheck passed", async () => {
    // Simulates: nothing existed when this enroll's fast precheck ran, but a concurrent enroll of
    // the same profile id won the race and landed first — by the time the lock is held and the
    // authoritative recheck runs, the profile is there. This is the exact race the two-phase
    // (precheck + locked recheck) design in enroll.ts exists to catch; without it, this test would
    // pass by not asserting anything meaningful, since a mock returning the same object twice can
    // never disagree with itself.
    existingProfileOnRecheck = { profileId: "test-agent" };

    await expect(runEnroll()).rejects.toThrow(/already exists/);
    expect(savedSecretKeys.has("test-agent")).toBe(false);
    expect(sessionReadCalls).toBe(2); // precheck + locked recheck, proving both actually ran
  });

  it("rejects an --app-url carrying URL credentials before it could leak into the enrollment URL", async () => {
    await expect(runEnroll({ "app-url": "https://user:secret@example.com/agent" })).rejects.toThrow(
      /--app-url must not contain URL credentials/,
    );
    expect(savedSecretKeys.size).toBe(0);
  });
});
