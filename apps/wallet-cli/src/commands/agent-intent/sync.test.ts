import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "../../shared/ui";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
} from "./__test-helpers__/agent-intent-mocks";
import { Session, type AgentIntentProfileMeta } from "../../session/session-store";

const PROFILE_ID = "my-agent";
const AGENT_PUBLIC_KEY = "0236cb7ebc1a324bd02abac533f7904f9579cc581c772285fecc6f5157a960b076";
const AGENT_SECRET_KEY = "agent-secret-key-must-never-be-printed";
const ROTATED_PATH = "m/0'/16'/9'";

const accountAccess = {
  mode: "direct-app16-key-reader",
  environment: "staging",
  trustchainId: "app16-root",
  applicationPath: "m/0'/16'/0'",
} as const;

function makeProfile(patch: Partial<AgentIntentProfileMeta> = {}): AgentIntentProfileMeta {
  return {
    profileId: PROFILE_ID,
    displayName: "My agent",
    description: "Proposes payments",
    source: "claude-code",
    environment: "staging",
    bffBaseUrl: "https://bff.example",
    publicKey: AGENT_PUBLIC_KEY,
    trustchainId: "app18-root",
    accountAccess: { ...accountAccess },
    ledgerSyncVersion: 5,
    enrollmentExpiresAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2025-12-31T00:00:00.000Z",
    ...patch,
  };
}

let storedProfile: AgentIntentProfileMeta | undefined;
// What every read after the first one sees, the way a concurrent command landing mid-sync would.
let profileAfterFirstRead: AgentIntentProfileMeta | undefined | "same-as-stored";
let sessionReadCalls: number;
let writeCalls: number;
let mergedInto: Session[];
let deletedSecretKeys: string[];
let sdkEnvironments: string[];
let restoreInputs: Array<{ trustchain: unknown; credentials: unknown }>;
let pullCalls: Array<{ environment: string; currentVersion: number | undefined }>;

let loadSecretKeyImpl: () => Promise<string | null>;
let restoreTrustchainImpl: () => unknown;
let pullSyncedAccountsImpl: () => unknown;
let mergeSyncedAccountsImpl: () => unknown;

function makeSession(): Session {
  sessionReadCalls++;
  const profile =
    sessionReadCalls > 1 && profileAfterFirstRead !== "same-as-stored"
      ? profileAfterFirstRead
      : storedProfile;
  const session = Session.from([]);
  if (profile) session.addAgentIntentProfile({ ...profile });
  session.write = () => {
    writeCalls++;
    storedProfile = session.getAgentIntentProfile(PROFILE_ID);
  };
  return session;
}

beforeAll(() =>
  activateAgentIntentMocks({
    sessionRead: async () => makeSession(),
    noopSessionLock: true,
    keychain: {
      loadAgentIntentSecretKey: () => loadSecretKeyImpl(),
      deleteAgentIntentSecretKey: (profileId: string) => {
        deletedSecretKeys.push(profileId);
        return true;
      },
    },
    lkrpSdk: {
      createAgentLedgerSyncSdk: (environment: string) => {
        sdkEnvironments.push(environment);
        return {
          restoreTrustchain: async (trustchain: unknown, credentials: unknown) => {
            restoreInputs.push({ trustchain, credentials });
            return restoreTrustchainImpl();
          },
        };
      },
    },
    cloudSync: {
      pullSyncedAccounts: async (
        _trustchain: unknown,
        _credentials: unknown,
        _sdk: unknown,
        environment: string,
        getCurrentVersion: () => number | undefined,
      ) => {
        pullCalls.push({ environment, currentVersion: getCurrentVersion() });
        return pullSyncedAccountsImpl();
      },
      mergeSyncedAccounts: (session: Session) => {
        mergedInto.push(session);
        return mergeSyncedAccountsImpl();
      },
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { default: syncCommand } = await import("./sync");

function runSync(output: "human" | "json" = "human") {
  return (
    syncCommand as unknown as {
      handler: (args: { flags: { profile: string; output?: "human" | "json" } }) => Promise<void>;
    }
  ).handler({ flags: { profile: PROFILE_ID, output } });
}

const emptyReport = { imported: [], unchanged: [], skipped: [], invalid: [] };

describe("agent-intent sync", () => {
  let restore: () => void;
  let stdoutWrites: string[];
  let stderrWrites: string[];

  beforeEach(() => {
    storedProfile = makeProfile();
    profileAfterFirstRead = "same-as-stored";
    sessionReadCalls = 0;
    writeCalls = 0;
    mergedInto = [];
    deletedSecretKeys = [];
    sdkEnvironments = [];
    restoreInputs = [];
    pullCalls = [];
    loadSecretKeyImpl = async () => AGENT_SECRET_KEY;
    restoreTrustchainImpl = () => ({
      rootId: accountAccess.trustchainId,
      applicationPath: accountAccess.applicationPath,
      walletSyncEncryptionKey: "wsek",
    });
    pullSyncedAccountsImpl = () => ({ status: "up-to-date" });
    mergeSyncedAccountsImpl = () => emptyReport;
    stdoutWrites = [];
    stderrWrites = [];
    restore = installOutputCapture({
      stdout: chunk => stdoutWrites.push(chunk),
      stderr: chunk => stderrWrites.push(chunk),
    });
  });

  afterEach(() => restore());

  it("should fail when the profile does not exist", async () => {
    storedProfile = undefined;

    await expect(runSync()).rejects.toThrow(/No Agent Intent profile named "my-agent"/);
  });

  it("should fail when the profile has no Ledger Sync access yet", async () => {
    storedProfile = makeProfile({ accountAccess: undefined });

    await expect(runSync()).rejects.toThrow(/has no Ledger Sync access yet/);
    expect(sdkEnvironments).toEqual([]);
  });

  it("should fail when the agent key is missing from the keychain", async () => {
    loadSecretKeyImpl = async () => null;

    await expect(runSync()).rejects.toThrow(/No agent key found in the OS keychain/);
    expect(sdkEnvironments).toEqual([]);
  });

  it("should wrap a keychain read failure in an actionable error", async () => {
    loadSecretKeyImpl = async () => {
      throw new Error("keychain locked");
    };

    await expect(runSync()).rejects.toThrow(/Could not read the agent key.*keychain locked/);
  });

  it("should restore the App-16 trustchain with the agent key and the profile's environment", async () => {
    await runSync();

    expect(sdkEnvironments).toEqual(["staging"]);
    expect(restoreInputs).toEqual([
      {
        trustchain: {
          rootId: accountAccess.trustchainId,
          applicationPath: accountAccess.applicationPath,
          walletSyncEncryptionKey: "",
        },
        credentials: { pubkey: AGENT_PUBLIC_KEY, privatekey: AGENT_SECRET_KEY },
      },
    ]);
    expect(pullCalls).toEqual([{ environment: "staging", currentVersion: 5 }]);
  });

  it("should refuse a restored trustchain whose root differs from the account access", async () => {
    restoreTrustchainImpl = () => ({ rootId: "other-root", applicationPath: "m/0'/16'/0'" });

    await expect(runSync()).rejects.toThrow(/does not match the profile's account access/);
    expect(pullCalls).toEqual([]);
    expect(writeCalls).toBe(0);
  });

  it("should refuse a restored trustchain whose path is not an App-16 path", async () => {
    restoreTrustchainImpl = () => ({
      rootId: accountAccess.trustchainId,
      applicationPath: "m/0'/17'/0'",
    });

    await expect(runSync()).rejects.toThrow(/does not match the profile's account access/);
    expect(writeCalls).toBe(0);
  });

  it("should report lost access without deleting anything when the agent was ejected", async () => {
    restoreTrustchainImpl = () => {
      const err = new Error("ejected");
      err.name = "TrustchainEjected";
      throw err;
    };

    await expect(runSync()).rejects.toThrow(/no longer has Ledger Sync access/);
    expect(writeCalls).toBe(0);
    expect(deletedSecretKeys).toEqual([]);
    expect(storedProfile?.accountAccess).toEqual(accountAccess);
  });

  it("should persist a rotated application path, drop the stale version and warn", async () => {
    restoreTrustchainImpl = () => ({
      rootId: accountAccess.trustchainId,
      applicationPath: ROTATED_PATH,
    });

    await runSync();

    expect(storedProfile?.accountAccess).toEqual({
      ...accountAccess,
      applicationPath: ROTATED_PATH,
    });
    expect(storedProfile?.ledgerSyncVersion).toBeUndefined();
    expect(pullCalls).toEqual([{ environment: "staging", currentVersion: undefined }]);
    expect(stderrWrites.join("")).toContain("key rotated");
  });

  it("should skip a stale rotation write and still merge when another process recorded it", async () => {
    restoreTrustchainImpl = () => ({
      rootId: accountAccess.trustchainId,
      applicationPath: ROTATED_PATH,
    });
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 6 });
    profileAfterFirstRead = makeProfile({
      accountAccess: { ...accountAccess, applicationPath: ROTATED_PATH },
      ledgerSyncVersion: undefined,
    });

    await runSync();

    expect(writeCalls).toBe(1);
    expect(mergedInto).toHaveLength(1);
    expect(storedProfile?.ledgerSyncVersion).toBe(6);
  });

  it("should cache the pulled version on the profile when no entry is invalid", async () => {
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 42 });
    mergeSyncedAccountsImpl = () => ({
      ...emptyReport,
      imported: [{ status: "imported", label: "eth-1", network: "ethereum:main" }],
    });

    await runSync();

    expect(storedProfile?.ledgerSyncVersion).toBe(42);
    expect(writeCalls).toBe(1);
  });

  it("should not cache the pulled version when an entry is invalid", async () => {
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 42 });
    mergeSyncedAccountsImpl = () => ({
      ...emptyReport,
      invalid: [{ status: "invalid", id: "x", reason: "bad" }],
    });

    await runSync();

    expect(storedProfile?.ledgerSyncVersion).toBe(5);
    expect(writeCalls).toBe(1);
  });

  it("should merge into a fresh read taken under the lock", async () => {
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 42 });

    await runSync();

    expect(sessionReadCalls).toBe(2);
    expect(mergedInto).toHaveLength(1);
  });

  it("should save nothing when the profile's access changed while syncing", async () => {
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 42 });
    profileAfterFirstRead = makeProfile({
      accountAccess: { ...accountAccess, trustchainId: "another-root" },
    });

    await expect(runSync()).rejects.toThrow(/changed while this sync was running.*nothing/s);
    expect(mergedInto).toEqual([]);
    expect(writeCalls).toBe(0);
  });

  it("should save nothing when the profile was removed while syncing", async () => {
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 42 });
    profileAfterFirstRead = undefined;

    await expect(runSync()).rejects.toThrow(/changed while this sync was running/);
    expect(writeCalls).toBe(0);
  });

  it("should clear the cached version when the remote document was deleted", async () => {
    pullSyncedAccountsImpl = () => ({ status: "deleted" });

    await runSync();

    expect(storedProfile?.ledgerSyncVersion).toBeUndefined();
    expect(mergedInto).toEqual([]);
    expect(writeCalls).toBe(1);
  });

  it("should report a malformed remote document as invalid without writing", async () => {
    pullSyncedAccountsImpl = () => ({ status: "malformed", reason: "no accounts list" });

    await runSync("json");

    expect(JSON.parse(stdoutWrites.join("").trim())).toMatchObject({
      command: "agent-intent sync",
      invalid: [{ status: "invalid", id: "<account list>", reason: "no accounts list" }],
    });
    expect(writeCalls).toBe(0);
  });

  it("should not write the session when already up to date", async () => {
    await runSync();

    expect(writeCalls).toBe(0);
    expect(stdoutWrites.join("")).toContain("Up to date");
  });

  it("should never print the agent secret key in human or json output", async () => {
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 9 });

    await runSync("human");
    await runSync("json");

    expect([...stdoutWrites, ...stderrWrites].join("")).not.toContain(AGENT_SECRET_KEY);
  });
});
