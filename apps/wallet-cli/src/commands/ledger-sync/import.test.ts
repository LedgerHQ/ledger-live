import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "../../shared/ui";
import { LedgerSyncCorruptKeychainError } from "../../ledger-sync/keychain";
import {
  activateLedgerSyncMocks,
  deactivateLedgerSyncMocks,
} from "./__test-helpers__/ledger-sync-mocks";

const trustchainMeta = { rootId: "root-abc", applicationPath: "m/0'/16'/6'" };

type SessionState = {
  ledgerSyncTrustchain?: typeof trustchainMeta;
  ledgerSyncEnvironment?: "staging" | "production";
  ledgerSyncVersion?: number;
};

let sessionState: SessionState;
// Set only by the race test: what every read after the first one sees, the way a concurrent
// `ledger-sync destroy`/`enroll` landing mid-import would look.
let sessionStateAfterFirstRead: SessionState | undefined;
let sessionReadCalls: number;
let setLedgerSyncTrustchainCalls: Array<{ meta: unknown; environment: string }>;
let setLedgerSyncVersionCalls: number[];
let clearLedgerSyncVersionCalls: number;
let mergedInto: unknown[];
let writeCalls: number;

let loadLedgerSyncMemberCredentialsImpl: () => unknown;
let restoreTrustchainImpl: () => unknown;
let pullSyncedAccountsImpl: () => unknown;
let mergeSyncedAccountsImpl: () => unknown;

beforeAll(() =>
  activateLedgerSyncMocks({
    sessionRead: async () => {
      sessionReadCalls++;
      const state =
        sessionReadCalls > 1 && sessionStateAfterFirstRead
          ? sessionStateAfterFirstRead
          : sessionState;
      const session = {
        ledgerSyncTrustchain: state.ledgerSyncTrustchain,
        ledgerSyncEnvironment: state.ledgerSyncEnvironment,
        ledgerSyncVersion: state.ledgerSyncVersion,
        setLedgerSyncTrustchain: (meta: unknown, environment: string) => {
          setLedgerSyncTrustchainCalls.push({ meta, environment });
        },
        setLedgerSyncVersion: (v: number) => {
          setLedgerSyncVersionCalls.push(v);
        },
        clearLedgerSyncVersion: () => {
          clearLedgerSyncVersionCalls += 1;
        },
        write: () => {
          writeCalls += 1;
        },
      };
      return session;
    },
    noopSessionLock: true,
    keychain: {
      loadLedgerSyncMemberCredentials: () => loadLedgerSyncMemberCredentialsImpl(),
    },
    lkrpSdk: {
      createLkrpSdk: () => ({ restoreTrustchain: async () => restoreTrustchainImpl() }),
    },
    cloudSync: {
      pullSyncedAccounts: async () => pullSyncedAccountsImpl(),
      mergeSyncedAccounts: (session: unknown) => {
        mergedInto.push(session);
        return mergeSyncedAccountsImpl();
      },
    },
  }),
);
afterAll(() => deactivateLedgerSyncMocks());

const { default: importCommand } = await import("./import");

function runImport(output: "human" | "json" = "human") {
  return (
    importCommand as unknown as {
      handler: (args: { flags: { output?: "human" | "json" } }) => Promise<void>;
    }
  ).handler({ flags: { output } });
}

const emptyReport = { imported: [], unchanged: [], skipped: [], invalid: [] };

describe("ledger-sync import", () => {
  let restore: () => void;
  let stderrWrites: string[];

  beforeEach(() => {
    sessionState = {
      ledgerSyncTrustchain: { ...trustchainMeta },
      ledgerSyncEnvironment: "staging",
      ledgerSyncVersion: 5,
    };
    sessionStateAfterFirstRead = undefined;
    sessionReadCalls = 0;
    setLedgerSyncTrustchainCalls = [];
    setLedgerSyncVersionCalls = [];
    clearLedgerSyncVersionCalls = 0;
    mergedInto = [];
    writeCalls = 0;
    loadLedgerSyncMemberCredentialsImpl = () => ({ privatekey: "priv", pubkey: "pub" });
    restoreTrustchainImpl = () => ({ ...trustchainMeta });
    pullSyncedAccountsImpl = () => ({ status: "up-to-date" });
    mergeSyncedAccountsImpl = () => emptyReport;
    stderrWrites = [];
    restore = installOutputCapture({ stdout: () => {}, stderr: chunk => stderrWrites.push(chunk) });
  });

  afterEach(() => restore());

  it("refuses to import before ledger-sync has been enrolled", async () => {
    sessionState.ledgerSyncTrustchain = undefined;

    await expect(runImport()).rejects.toThrow(/Ledger Sync not enrolled/);
  });

  it("reports a corrupt keychain entry as an actionable destroy-then-enroll message", async () => {
    loadLedgerSyncMemberCredentialsImpl = () => {
      throw new LedgerSyncCorruptKeychainError("corrupt");
    };

    await expect(runImport()).rejects.toThrow(
      /member credentials not found.*ledger-sync destroy.*ledger-sync enroll/s,
    );
  });

  it("propagates a keychain error that isn't a corrupt-entry error", async () => {
    const unexpected = new Error("keychain service unavailable");
    loadLedgerSyncMemberCredentialsImpl = () => {
      throw unexpected;
    };

    await expect(runImport()).rejects.toBe(unexpected);
  });

  it("maps TrustchainEjected to a re-enroll message instead of a raw SDK error", async () => {
    restoreTrustchainImpl = () => {
      const err = new Error("ejected");
      err.name = "TrustchainEjected";
      throw err;
    };

    await expect(runImport()).rejects.toThrow(/no longer a Ledger Sync member/);
  });

  it("persists a rotated applicationPath under the lock and warns", async () => {
    restoreTrustchainImpl = () => ({
      rootId: trustchainMeta.rootId,
      applicationPath: "m/0'/16'/9'",
    });

    await runImport();

    expect(setLedgerSyncTrustchainCalls).toEqual([
      {
        meta: { rootId: trustchainMeta.rootId, applicationPath: "m/0'/16'/9'" },
        environment: "staging",
      },
    ]);
    expect(stderrWrites.join("")).toContain("key rotated");
    expect(writeCalls).toBe(1);
    expect(sessionReadCalls).toBe(2); // initial read + the locked rotation read
  });

  it("skips a stale rotation write when the session already moved on, then merges against it", async () => {
    restoreTrustchainImpl = () => ({
      rootId: trustchainMeta.rootId,
      applicationPath: "m/0'/16'/9'",
    });
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 6 });
    // Another process already recorded the same rotation before this one got the lock.
    sessionStateAfterFirstRead = {
      ...sessionState,
      ledgerSyncTrustchain: { rootId: trustchainMeta.rootId, applicationPath: "m/0'/16'/9'" },
    };

    await runImport();

    expect(setLedgerSyncTrustchainCalls).toEqual([]);
    expect(mergedInto).toHaveLength(1);
    expect(setLedgerSyncVersionCalls).toEqual([6]);
  });

  it("advances the cached version only when nothing came back invalid", async () => {
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 42 });
    mergeSyncedAccountsImpl = () => ({
      ...emptyReport,
      invalid: [{ status: "invalid", id: "x", reason: "bad" }],
    });

    await runImport();

    expect(setLedgerSyncVersionCalls).toEqual([]);
    expect(writeCalls).toBe(1);
  });

  it("advances the cached version when the pull contained no invalid entries", async () => {
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 42 });
    mergeSyncedAccountsImpl = () => ({
      ...emptyReport,
      imported: [{ status: "imported", label: "eth-1", network: "ethereum:main" }],
    });

    await runImport();

    expect(setLedgerSyncVersionCalls).toEqual([42]);
    expect(writeCalls).toBe(1);
  });

  it("merges into a fresh read taken under the lock, not the session read at the start", async () => {
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 42 });

    await runImport();

    expect(sessionReadCalls).toBe(2);
    expect(mergedInto).toHaveLength(1);
  });

  it("saves nothing when Ledger Sync changed locally while the import was running", async () => {
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 42 });
    sessionStateAfterFirstRead = { ...sessionState, ledgerSyncTrustchain: undefined };

    await expect(runImport()).rejects.toThrow(/changed locally.*nothing was saved/s);
    expect(mergedInto).toEqual([]);
    expect(setLedgerSyncVersionCalls).toEqual([]);
    expect(writeCalls).toBe(0);
  });

  it("clears the cached version and reports nothing when the remote document was deleted", async () => {
    pullSyncedAccountsImpl = () => ({ status: "deleted" });

    await runImport();

    expect(clearLedgerSyncVersionCalls).toBe(1);
    expect(writeCalls).toBe(1);
  });

  it("does not write the session when already up to date", async () => {
    pullSyncedAccountsImpl = () => ({ status: "up-to-date" });

    await runImport();

    expect(writeCalls).toBe(0);
  });

  it("never prints the member private key, in human or json output", async () => {
    const secret = "ledger-sync-private-key-must-never-be-printed";
    loadLedgerSyncMemberCredentialsImpl = () => ({ privatekey: secret, pubkey: "pub" });
    pullSyncedAccountsImpl = () => ({ status: "new-data", accounts: [], version: 9 });
    const stdoutWrites: string[] = [];
    restore();
    restore = installOutputCapture({
      stdout: chunk => stdoutWrites.push(chunk),
      stderr: chunk => stderrWrites.push(chunk),
    });

    await runImport("human");
    await runImport("json");

    expect([...stdoutWrites, ...stderrWrites].join("")).not.toContain(secret);
  });
});
