import "../../live-common-setup";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { installOutputCapture } from "../../shared/ui";

let existingProfile: { profileId: string } | undefined;
let keychainHasEntry: boolean;
let addAgentIntentProfileImpl: (profile: Record<string, unknown>) => void;
let writeImpl: () => void;

const savedSecretKeys = new Set<string>();
const deletedSecretKeyCalls: string[] = [];

const realSessionStore = await import("../../session/session-store");
mock.module("../../session/session-store", () => ({
  ...realSessionStore,
  Session: {
    read: async () => ({
      getAgentIntentProfile: (_profileId: string) => existingProfile,
      addAgentIntentProfile: (profile: Record<string, unknown>) => addAgentIntentProfileImpl(profile),
      write: () => writeImpl(),
    }),
  },
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
  "bff-url"?: string;
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

    await expect(runEnroll()).rejects.toThrow(/keychain entry for profile "test-agent" already exists/);
  });

  it("rejects an invalid --expires-in before touching the keychain or session", async () => {
    await expect(runEnroll({ "expires-in": "not-a-duration" })).rejects.toThrow(
      /--expires-in "not-a-duration" is invalid/,
    );
    expect(savedSecretKeys.size).toBe(0);
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

  it("uses the --bff-url override instead of the environment default when given", async () => {
    let persistedProfile: Record<string, unknown> | undefined;
    addAgentIntentProfileImpl = profile => {
      persistedProfile = profile;
    };

    await runEnroll({ "bff-url": "https://custom.example.com/agent-intent" });

    expect(persistedProfile).toMatchObject({
      bffBaseUrl: "https://custom.example.com/agent-intent",
    });
  });
});
