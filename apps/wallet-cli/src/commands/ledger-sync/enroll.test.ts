import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "../../shared/ui";
import {
  activateLedgerSyncMocks,
  deactivateLedgerSyncMocks,
} from "./__test-helpers__/ledger-sync-mocks";

const trustchain = { rootId: "root-abc", applicationPath: "m/0'/16'/0'" };
const PRIVATE_KEY = "ledger-sync-private-key-must-never-be-printed";
const memberCredentials = { privatekey: PRIVATE_KEY, pubkey: "pub" };

let enrolledOnPrecheck: boolean;
// Set only by the race test: what the locked recheck sees after the device round-trip.
let enrolledOnRecheck: boolean | undefined;
let keychainHasEntry: boolean;
let sessionReadCalls: number;
let setLedgerSyncTrustchainCalls: Array<{ meta: unknown; environment: string }>;
let savedCredentials: unknown[];
let writeCalls: number;
let createLkrpSdkOptions: unknown[];
let writeImpl: () => void;
let deletedCredentials: number;
let deleteSucceeds: boolean;
let deviceStep: () => Promise<unknown>;
let initMemberCredentialsImpl: () => Promise<unknown>;
let stderr: string[];

beforeAll(() =>
  activateLedgerSyncMocks({
    sessionRead: async () => {
      sessionReadCalls++;
      const enrolled =
        sessionReadCalls > 1 && enrolledOnRecheck !== undefined
          ? enrolledOnRecheck
          : enrolledOnPrecheck;
      return {
        ledgerSyncTrustchain: enrolled ? trustchain : undefined,
        setLedgerSyncTrustchain: (meta: unknown, environment: string) => {
          setLedgerSyncTrustchainCalls.push({ meta, environment });
        },
        write: () => {
          writeCalls += 1;
          writeImpl();
        },
      };
    },
    noopSessionLock: true,
    keychain: {
      hasLedgerSyncMemberCredentials: () => keychainHasEntry,
      deleteLedgerSyncMemberCredentials: () => {
        deletedCredentials += 1;
        return deleteSucceeds;
      },
      saveLedgerSyncMemberCredentials: (creds: unknown) => {
        savedCredentials.push(creds);
      },
    },
    lkrpSdk: {
      createLkrpSdk: (options: unknown) => {
        createLkrpSdkOptions.push(options);
        return {
          initMemberCredentials: () => initMemberCredentialsImpl(),
          getOrCreateTrustchain: () => deviceStep(),
        };
      },
    },
    device: {
      withLkrpDeviceSession: (fn: () => unknown) => fn(),
    },
  }),
);
afterAll(() => deactivateLedgerSyncMocks());

const { default: enrollCommand } = await import("./enroll");

type EnrollFlags = { name?: string; environment: "staging" | "production"; output?: "json" };

function runEnroll(overrides: Partial<EnrollFlags> = {}) {
  const flags: EnrollFlags = { environment: "production", output: "json", ...overrides };
  return (
    enrollCommand as unknown as { handler: (args: { flags: EnrollFlags }) => Promise<void> }
  ).handler({ flags });
}

let stdout: string[];

/** In json mode a failure is reported as an error envelope on stdout, and the handler rethrows a
 * generic exit error — so assert on the envelope's message. */
async function expectFailure(run: () => Promise<void>, message: RegExp): Promise<void> {
  await expect(run()).rejects.toThrow();
  const envelope = JSON.parse(stdout.join("").trim().split("\n").at(-1) ?? "{}") as {
    ok?: boolean;
    error?: { message?: string };
  };
  expect(envelope.ok).toBe(false);
  expect(envelope.error?.message).toMatch(message);
}

describe("ledger-sync enroll", () => {
  let restore: () => void;

  beforeEach(() => {
    enrolledOnPrecheck = false;
    enrolledOnRecheck = undefined;
    keychainHasEntry = false;
    sessionReadCalls = 0;
    setLedgerSyncTrustchainCalls = [];
    savedCredentials = [];
    writeCalls = 0;
    createLkrpSdkOptions = [];
    writeImpl = () => {};
    deletedCredentials = 0;
    deleteSucceeds = true;
    deviceStep = async () => ({ trustchain });
    initMemberCredentialsImpl = async () => memberCredentials;
    stdout = [];
    stderr = [];
    restore = installOutputCapture({
      stdout: chunk => stdout.push(chunk),
      stderr: chunk => stderr.push(chunk),
    });
  });

  afterEach(() => restore());

  it("refuses to enroll twice", async () => {
    enrolledOnPrecheck = true;

    await expectFailure(runEnroll, /already enrolled/);
    expect(createLkrpSdkOptions).toEqual([]);
  });

  it("refuses when a stray keychain credential exists without session metadata", async () => {
    keychainHasEntry = true;

    await expectFailure(runEnroll, /member credential already exists in the OS keychain/);
    expect(createLkrpSdkOptions).toEqual([]);
  });

  it("saves the credentials and records the trustchain with its environment", async () => {
    await runEnroll({ environment: "staging", name: "ci-box" });

    expect(createLkrpSdkOptions).toEqual([
      expect.objectContaining({ memberName: "ci-box", environment: "staging" }),
    ]);
    expect(savedCredentials).toEqual([memberCredentials]);
    expect(setLedgerSyncTrustchainCalls).toEqual([{ meta: trustchain, environment: "staging" }]);
    expect(writeCalls).toBe(1);
    expect(sessionReadCalls).toBe(2); // precheck + locked recheck
  });

  it("rolls back the keychain and names the orphaned member when saving locally fails", async () => {
    writeImpl = () => {
      throw new Error("disk full");
    };

    await expectFailure(
      () => runEnroll({ name: "ci-box" }),
      /registered "ci-box" as a member.*disk full.*Remove "ci-box" from Ledger Sync in Ledger Live/s,
    );
    expect(deletedCredentials).toBe(1);
  });

  it("says so when the keychain rollback itself fails", async () => {
    writeImpl = () => {
      throw new Error("disk full");
    };
    deleteSucceeds = false;

    await expectFailure(
      runEnroll,
      /keychain entry could not be removed either.*ledger-sync destroy/s,
    );
  });

  it("reports a lost race instead of overwriting a concurrent enrollment", async () => {
    enrolledOnRecheck = true;

    await expectFailure(runEnroll, /Lost the race.*still added as a Ledger Sync member/s);
    expect(savedCredentials).toEqual([]);
    expect(writeCalls).toBe(0);
  });

  it("surfaces a device failure and saves nothing", async () => {
    deviceStep = async () => {
      throw new Error("Ledger Sync app not open on the device");
    };

    await expectFailure(runEnroll, /Ledger Sync app not open/);
    expect(savedCredentials).toEqual([]);
    expect(writeCalls).toBe(0);
  });

  it("surfaces a member-credential generation failure before touching the device", async () => {
    let deviceCalls = 0;
    initMemberCredentialsImpl = async () => {
      throw new Error("keypair generation failed");
    };
    deviceStep = async () => {
      deviceCalls++;
      return { trustchain };
    };

    await expectFailure(runEnroll, /keypair generation failed/);
    expect(deviceCalls).toBe(0);
    expect(savedCredentials).toEqual([]);
  });

  it("never prints the member private key, in human or json output", async () => {
    await runEnroll({ output: undefined });
    await runEnroll({ output: "json" });

    const printed = [...stdout, ...stderr].join("");
    expect(printed).toContain(trustchain.rootId);
    expect(printed).not.toContain(PRIVATE_KEY);
  });
});
