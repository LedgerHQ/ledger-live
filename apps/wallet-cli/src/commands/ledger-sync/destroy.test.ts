import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "../../shared/ui";
import { LedgerSyncCorruptKeychainError } from "../../ledger-sync/keychain";
import {
  activateLedgerSyncMocks,
  deactivateLedgerSyncMocks,
} from "./__test-helpers__/ledger-sync-mocks";

const trustchainMeta = { rootId: "root-abc", applicationPath: "m/0'/16'/0'" };
type Meta = typeof trustchainMeta | undefined;

// One entry per Session.read, in order; the last one repeats — lets a test model another process
// changing the session between this command's reads.
let sessionReads: Meta[];
let sessionReadCalls: number;
let wipeCalls: number;
let writeCalls: number;
let confirmed: boolean;
let keychainHasEntry: boolean;
let deleteSucceeds: boolean;
let deleteCalls: number;
let loadCredentialsImpl: () => unknown;
let destroyApplicationImpl: () => Promise<{ trustchainDestroyed: boolean }>;
let destroyApplicationCalls: number;
let stdout: string[];

beforeAll(() =>
  activateLedgerSyncMocks({
    sessionRead: async () => {
      const meta = sessionReads[Math.min(sessionReadCalls, sessionReads.length - 1)];
      sessionReadCalls++;
      return {
        ledgerSyncTrustchain: meta,
        ledgerSyncEnvironment: "staging",
        wipeLedgerSync: () => {
          wipeCalls += 1;
        },
        write: () => {
          writeCalls += 1;
        },
      };
    },
    noopSessionLock: true,
    inputs: { confirmTyped: async () => confirmed },
    keychain: {
      hasLedgerSyncMemberCredentials: () => keychainHasEntry,
      loadLedgerSyncMemberCredentials: () => loadCredentialsImpl(),
      deleteLedgerSyncMemberCredentials: () => {
        deleteCalls += 1;
        return deleteSucceeds;
      },
    },
    lkrpSdk: {
      createLkrpSdk: () => ({
        destroyApplication: () => {
          destroyApplicationCalls += 1;
          return destroyApplicationImpl();
        },
      }),
    },
  }),
);
afterAll(() => deactivateLedgerSyncMocks());

const { default: destroyCommand } = await import("./destroy");

function runDestroy() {
  return (
    destroyCommand as unknown as {
      handler: (args: { flags: { output?: "json" } }) => Promise<void>;
    }
  ).handler({ flags: { output: "json" } });
}

function lastEnvelope(): Record<string, unknown> {
  return JSON.parse(stdout.join("").trim().split("\n").at(-1) ?? "{}");
}

/** In json mode a failure is reported as an error envelope on stdout, and the handler rethrows a
 * generic exit error — so assert on the envelope's message. */
async function expectFailure(run: () => Promise<void>, message: RegExp): Promise<void> {
  await expect(run()).rejects.toThrow();
  const envelope = lastEnvelope() as { ok?: boolean; error?: { message?: string } };
  expect(envelope.ok).toBe(false);
  expect(envelope.error?.message).toMatch(message);
}

describe("ledger-sync destroy", () => {
  let restore: () => void;

  beforeEach(() => {
    sessionReads = [trustchainMeta];
    sessionReadCalls = 0;
    wipeCalls = 0;
    writeCalls = 0;
    confirmed = true;
    keychainHasEntry = true;
    deleteSucceeds = true;
    deleteCalls = 0;
    loadCredentialsImpl = () => ({ privatekey: "priv", pubkey: "pub" });
    destroyApplicationImpl = async () => ({ trustchainDestroyed: false });
    destroyApplicationCalls = 0;
    stdout = [];
    restore = installOutputCapture({ stdout: chunk => stdout.push(chunk), stderr: () => {} });
  });

  afterEach(() => restore());

  it("refuses when Ledger Sync is not enrolled and no credential is stored", async () => {
    sessionReads = [undefined];
    keychainHasEntry = false;

    await expectFailure(runDestroy, /Nothing to destroy/);
  });

  it("wipes a stray keychain credential locally when there is no session metadata", async () => {
    sessionReads = [undefined];

    await runDestroy();

    expect(destroyApplicationCalls).toBe(0);
    expect(deleteCalls).toBe(1);
    expect(wipeCalls).toBe(1);
    expect(lastEnvelope()).toMatchObject({ remote_succeeded: false, local_wiped: true });
  });

  it("refuses the stray-key wipe if another process enrolled while waiting for confirmation", async () => {
    sessionReads = [undefined, trustchainMeta];

    await expectFailure(runDestroy, /enrolled by another process/);
    expect(deleteCalls).toBe(0);
    expect(writeCalls).toBe(0);
  });

  it("changes nothing when the user does not confirm", async () => {
    confirmed = false;

    await runDestroy();

    expect(destroyApplicationCalls).toBe(0);
    expect(deleteCalls).toBe(0);
    expect(lastEnvelope()).toMatchObject({ cancelled: true });
  });

  it("tears down remotely, then wipes local credentials and session state", async () => {
    destroyApplicationImpl = async () => ({ trustchainDestroyed: true });

    await runDestroy();

    expect(destroyApplicationCalls).toBe(1);
    expect(deleteCalls).toBe(1);
    expect(wipeCalls).toBe(1);
    expect(writeCalls).toBe(1);
    expect(lastEnvelope()).toMatchObject({
      destroyed: true,
      remote_succeeded: true,
      local_wiped: true,
    });
  });

  it("treats TrustchainEjected as already removed and still wipes locally", async () => {
    destroyApplicationImpl = async () => {
      const err = new Error("ejected");
      err.name = "TrustchainEjected";
      throw err;
    };

    await runDestroy();

    expect(deleteCalls).toBe(1);
    expect(lastEnvelope()).toMatchObject({ member_ejected: true, local_wiped: true });
  });

  it("keeps everything local when the remote teardown fails", async () => {
    destroyApplicationImpl = async () => {
      throw new Error("503");
    };

    await expectFailure(runDestroy, /Remote teardown failed.*No local changes made/s);
    expect(deleteCalls).toBe(0);
    expect(writeCalls).toBe(0);
  });

  it("falls back to a local wipe when the stored credential is corrupt", async () => {
    loadCredentialsImpl = () => {
      throw new LedgerSyncCorruptKeychainError("corrupt");
    };

    await runDestroy();

    expect(destroyApplicationCalls).toBe(0);
    expect(deleteCalls).toBe(1);
  });

  it("aborts before the remote call if Ledger Sync changed while waiting for confirmation", async () => {
    sessionReads = [trustchainMeta, { ...trustchainMeta, applicationPath: "m/0'/16'/1'" }];

    await expectFailure(runDestroy, /changed locally while this destroy was waiting/);
    expect(destroyApplicationCalls).toBe(0);
    expect(deleteCalls).toBe(0);
  });

  it("leaves local state alone if it was re-enrolled during the remote teardown", async () => {
    sessionReads = [
      trustchainMeta,
      trustchainMeta,
      { rootId: "root-new", applicationPath: "m/0'/16'/0'" },
    ];

    await expectFailure(runDestroy, /re-enrolled or rotated.*left untouched/s);
    expect(destroyApplicationCalls).toBe(1);
    expect(deleteCalls).toBe(0);
    expect(writeCalls).toBe(0);
  });

  it("keeps the session pointer when the keychain delete fails", async () => {
    deleteSucceeds = false;

    await runDestroy();

    expect(wipeCalls).toBe(0);
    expect(writeCalls).toBe(0);
    expect(lastEnvelope()).toMatchObject({ local_wiped: false });
  });

  it("never prints the member private key, in human or json output", async () => {
    const secret = "ledger-sync-private-key-must-never-be-printed";
    loadCredentialsImpl = () => ({ privatekey: secret, pubkey: "pub" });
    let stderr = "";
    restore();
    restore = installOutputCapture({
      stdout: chunk => stdout.push(chunk),
      stderr: chunk => {
        stderr += chunk;
      },
    });

    await runDestroy();

    expect(stdout.join("") + stderr).not.toContain(secret);
  });
});
