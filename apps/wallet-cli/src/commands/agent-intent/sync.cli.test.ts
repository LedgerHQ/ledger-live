import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { YAML } from "bun";
import { TrustchainEjected } from "@ledgerhq/ledger-key-ring-protocol/errors";
import { _setTestAgentLedgerSyncSdk } from "../../key-ring/lkrp-sdk";
import { ledgerSyncSupport } from "../../ledger-sync/cloud-sync-accounts";
import { ETH_ADDR } from "../../shared/accountDescriptor/test-fixtures";
import { makeEnrolledProfile, type EnrolledProfile } from "../../testing/agent-intent-service";
import { runCli } from "../../testing/cli-runner";
import {
  FakeLedgerSync,
  syncedDocument,
  type CloudSyncReply,
} from "../../testing/fake-ledger-sync";
import { MOCK_SOL_DESCRIPTOR } from "../../testing/constants";
import { MockServer } from "../../testing/mock-server";

const SUPPORT = ledgerSyncSupport();
const ROTATED_PATH = "m/0'/16'/9'";
const ACCOUNT_ACCESS = {
  mode: "direct-app16-key-reader",
  environment: "staging",
  trustchainId: "app16-root",
  applicationPath: "m/0'/16'/0'",
};

const ETH_ACCOUNT = {
  id: `js:2:ethereum:${ETH_ADDR}:ethM`,
  currencyId: "ethereum",
  freshAddress: ETH_ADDR,
  seedIdentifier: ETH_ADDR,
  derivationMode: "ethM",
  index: 0,
};
const POLKADOT_ACCOUNT = {
  id: "js:2:polkadot:5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty:polkadotbip44",
  currencyId: "polkadot",
  freshAddress: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  seedIdentifier: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  derivationMode: "polkadotbip44",
  index: 0,
};
const MALFORMED_ACCOUNT = { id: "not-a-real-descriptor" };

const ledgerSync = new FakeLedgerSync();
const server = new MockServer(ledgerSync.routes);
let fixture: EnrolledProfile;
let env: Record<string, string>;
let enrolledSession: string;
let enrolledKeys: Map<string, string>;

beforeAll(async () => {
  server.start();
  fixture = await makeEnrolledProfile({
    profile: { accountAccess: ACCOUNT_ACCESS, ledgerSyncVersion: 5, ledgerSyncSupport: SUPPORT },
  });
  env = { ...fixture.env, WALLET_CLI_MOCK_PORT: String(server.port) };
  enrolledSession = readFileSync(fixture.sessionPath, "utf8");
  enrolledKeys = new Map(fixture.keychain.entries);
  _setTestAgentLedgerSyncSdk(ledgerSync.createSdk);
});
afterAll(() => {
  _setTestAgentLedgerSyncSdk(null);
  fixture.cleanup();
  server.stop();
});
beforeEach(() => {
  ledgerSync.reset();
  writeFileSync(fixture.sessionPath, enrolledSession);
});
afterEach(() => {
  fixture.keychain.readError = undefined;
  fixture.keychain.entries.clear();
  for (const [key, value] of enrolledKeys) fixture.keychain.entries.set(key, value);
});

type SavedSession = { accounts: { label: string }[]; agentIntentProfiles?: Profile[] };
type Profile = Record<string, unknown> & { accountAccess?: typeof ACCOUNT_ACCESS };

const sessionFile = (): string => readFileSync(fixture.sessionPath, "utf8");
const savedSession = (): SavedSession => YAML.parse(sessionFile()) as SavedSession;
const savedProfile = (): Profile | undefined => savedSession().agentIntentProfiles?.[0];

/** Changes the stored profile, `undefined` dropping a field, as another command would. */
function editProfile(patch: Profile): void {
  const session = savedSession();
  const [profile] = session.agentIntentProfiles ?? [];
  session.agentIntentProfiles = [{ ...profile, ...patch }];
  writeFileSync(fixture.sessionPath, YAML.stringify(session));
}

const accounts = (list: unknown[], version: number): CloudSyncReply =>
  syncedDocument({ accounts: list }, version);

const ejected = (): Error => new TrustchainEjected("removed from the group");

function sync(...args: string[]) {
  return runCli(["agent-intent", "sync", "--profile", "bot", ...args], env);
}

async function syncJson() {
  const run = await sync("--output", "json");
  return { ...run, json: JSON.parse(run.stdout) };
}

describe("agent-intent sync (CLI)", () => {
  it("restores the App-16 trustchain with the agent's own key and pulls from the cached version", async () => {
    const { exitCode, stderr } = await sync();

    expect(exitCode, stderr).toBe(0);
    expect(ledgerSync.environments).toEqual(["staging"]);
    expect(ledgerSync.restores).toEqual([
      {
        trustchain: {
          rootId: ACCOUNT_ACCESS.trustchainId,
          applicationPath: ACCOUNT_ACCESS.applicationPath,
          walletSyncEncryptionKey: "",
        },
        credentials: {
          pubkey: fixture.agent.publicKey,
          privatekey: fixture.agent.exportSecretKey(),
        },
      },
    ]);
    expect(ledgerSync.pulls).toEqual([
      {
        version: "5",
        path: ACCOUNT_ACCESS.applicationPath,
        id: ACCOUNT_ACCESS.trustchainId,
        authorization: "Bearer ledger-sync-jwt",
      },
    ]);
  });

  it("imports the synced accounts into the session and caches the pulled version", async () => {
    ledgerSync.serve(accounts([ETH_ACCOUNT], 42));

    const { json, exitCode } = await syncJson();

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({
      status: "success",
      command: "agent-intent sync",
      imported: [{ status: "imported", network: "ethereum" }],
      unchanged: [],
      skipped: [],
      invalid: [],
    });
    const [account] = savedSession().accounts;
    expect(account?.label).toBe(json.imported[0].label);
    expect(savedProfile()).toMatchObject({ ledgerSyncVersion: 42, ledgerSyncSupport: SUPPORT });
  });

  it("reports imported, unchanged, skipped and invalid accounts in human output", async () => {
    ledgerSync.serve(accounts([ETH_ACCOUNT], 6));
    await sync();
    ledgerSync.serve(accounts([ETH_ACCOUNT, POLKADOT_ACCOUNT, MALFORMED_ACCOUNT], 7));

    const { stdout, exitCode } = await sync();

    expect(exitCode).toBe(0);
    const [{ label }] = savedSession().accounts as [{ label: string }];
    expect(stdout).toContain(`Unchanged (1): ${label}`);
    expect(stdout).toContain("Skipped (1, unsupported):");
    expect(stdout).toContain(`${POLKADOT_ACCOUNT.id}: Currency family "polkadot" is not supported`);
    expect(stdout).toContain("Invalid (1):");
    expect(stdout).toContain("not-a-real-descriptor: ");
    expect(savedSession().accounts).toHaveLength(1);
  });

  it("lists each imported account with its network in human output", async () => {
    ledgerSync.serve(accounts([ETH_ACCOUNT], 6));

    const { stdout } = await sync();

    const [{ label }] = savedSession().accounts as [{ label: string }];
    expect(stdout).toContain("Imported (1):");
    expect(stdout).toMatch(new RegExp(`${label}\\s+ethereum`));
  });

  it("leaves the session untouched when Ledger Sync is up to date", async () => {
    const before = sessionFile();

    const { stdout, exitCode } = await sync();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Up to date. Nothing to import.");
    expect(sessionFile()).toBe(before);
  });

  it("rejects a profile that does not exist, before reaching Ledger Sync", async () => {
    const { json, exitCode } = await runCli(
      ["agent-intent", "sync", "--profile", "other", "--output", "json"],
      env,
    ).then(run => ({ ...run, json: JSON.parse(run.stdout) }));

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/No Agent Intent profile named "other"/);
    expect(ledgerSync.environments).toEqual([]);
  });

  it("rejects a profile without Ledger Sync access yet, before reading the agent key", async () => {
    editProfile({ accountAccess: undefined });
    fixture.keychain.readError = new Error("the agent key was read");

    const { json, exitCode } = await syncJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/has no Ledger Sync access yet/);
    expect(ledgerSync.environments).toEqual([]);
  });

  it("fails when the agent key is missing from the keychain", async () => {
    fixture.keychain.entries.clear();

    const { json, exitCode } = await syncJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/No agent key found in the OS keychain/);
    expect(ledgerSync.environments).toEqual([]);
  });

  it("explains a keychain that can't be read", async () => {
    fixture.keychain.readError = new Error("keychain locked");

    const { json, exitCode } = await syncJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/Could not read the agent key.*keychain locked/);
  });

  it("fails before restoring when the keychain key does not match the recorded public key", async () => {
    editProfile({ publicKey: `02${"1".repeat(64)}` });

    const { json, exitCode } = await syncJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/does not match its recorded public key/);
    expect(ledgerSync.restores).toEqual([]);
  });

  it.each([
    ["root", { rootId: "other-root" }],
    ["path, not an App-16 one,", { applicationPath: "m/0'/17'/0'" }],
  ])(
    "refuses a restored trustchain whose %s differs from the account access",
    async (_part, patch) => {
      ledgerSync.restoreAs(patch);
      const before = sessionFile();

      const { json, exitCode } = await syncJson();

      expect(exitCode).toBe(1);
      expect(json.error.message).toMatch(/does not match the profile's account access/);
      expect(ledgerSync.pulls).toEqual([]);
      expect(sessionFile()).toBe(before);
    },
  );

  it("reports lost access without deleting anything when the agent was ejected", async () => {
    ledgerSync.failRestore(ejected());
    const before = sessionFile();

    const { json, exitCode } = await syncJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/no longer has Ledger Sync access.*Nothing was changed/);
    expect(sessionFile()).toBe(before);
    expect(fixture.keychain.entries).toEqual(enrolledKeys);
  });

  it("reports lost access without recording a rotation when ejected during the pull", async () => {
    ledgerSync.restoreAs({ applicationPath: ROTATED_PATH }).failAuth(ejected());
    const before = sessionFile();

    const { json, exitCode } = await syncJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/no longer has Ledger Sync access/);
    expect(sessionFile()).toBe(before);
  });

  it("fails without saving anything when Cloud Sync is down", async () => {
    ledgerSync.serve({ status: 503, json: { message: "Service Unavailable" } });
    const before = sessionFile();

    const { json, exitCode } = await syncJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toContain("Service Unavailable");
    expect(sessionFile()).toBe(before);
  });

  it("records a rotated Ledger Sync key, pulls everything with it and warns", async () => {
    ledgerSync.restoreAs({ applicationPath: ROTATED_PATH });

    const { stderr, exitCode } = await sync();

    expect(exitCode).toBe(0);
    expect(stderr).toContain("Ledger Sync key rotated since enrollment");
    expect(ledgerSync.pulls.map(p => [p.version, p.path])).toEqual([[null, ROTATED_PATH]]);
    expect(savedProfile()?.accountAccess).toEqual({
      ...ACCOUNT_ACCESS,
      applicationPath: ROTATED_PATH,
    });
    expect(savedProfile()?.ledgerSyncVersion).toBeUndefined();
  });

  it("still imports when another command recorded the rotation during the pull", async () => {
    ledgerSync.restoreAs({ applicationPath: ROTATED_PATH }).serve(accounts([ETH_ACCOUNT], 6), () =>
      editProfile({
        accountAccess: { ...ACCOUNT_ACCESS, applicationPath: ROTATED_PATH },
        ledgerSyncVersion: undefined,
      }),
    );

    const { exitCode } = await sync();

    expect(exitCode).toBe(0);
    expect(savedSession().accounts).toHaveLength(1);
    expect(savedProfile()).toMatchObject({
      accountAccess: { applicationPath: ROTATED_PATH },
      ledgerSyncVersion: 6,
    });
  });

  it("doesn't record the rotation over a profile another command changed during the pull", async () => {
    const reEnrolled = { ...ACCOUNT_ACCESS, trustchainId: "another-root" };
    ledgerSync
      .restoreAs({ applicationPath: ROTATED_PATH })
      .serve(accounts([ETH_ACCOUNT], 6), () => editProfile({ accountAccess: reEnrolled }));

    const { exitCode } = await sync();

    expect(exitCode).toBe(1);
    expect(savedProfile()?.accountAccess).toEqual(reEnrolled);
    expect(savedSession().accounts).toEqual([]);
  });

  it.each([
    ["with other import support", "other-support"],
    ["before the import support was recorded", undefined],
  ])(
    "pulls everything once when the version was cached %s, then caches it with this one",
    async (_case, cachedWith) => {
      editProfile({ ledgerSyncSupport: cachedWith });
      ledgerSync.serve(accounts([ETH_ACCOUNT], 6));

      await sync();

      expect(ledgerSync.pulls.map(p => p.version)).toEqual([null]);
      expect(savedSession().accounts).toHaveLength(1);
      expect(savedProfile()).toMatchObject({ ledgerSyncVersion: 6, ledgerSyncSupport: SUPPORT });
    },
  );

  it("imports the valid accounts but caches neither version nor support when one is invalid", async () => {
    editProfile({ ledgerSyncSupport: "other-support" });
    ledgerSync.serve(accounts([ETH_ACCOUNT, MALFORMED_ACCOUNT], 42));

    const { exitCode } = await sync();

    expect(exitCode).toBe(0);
    expect(savedSession().accounts).toHaveLength(1);
    expect(savedProfile()).toMatchObject({
      ledgerSyncVersion: 5,
      ledgerSyncSupport: "other-support",
    });
  });

  it("keeps the version a concurrent sync cached instead of this pull's", async () => {
    ledgerSync.serve(accounts([ETH_ACCOUNT], 6), () => editProfile({ ledgerSyncVersion: 8 }));

    await sync();

    expect(savedSession().accounts).toHaveLength(1);
    expect(savedProfile()?.ledgerSyncVersion).toBe(8);
  });

  it("keeps a newer version and support a concurrent sync cached during a forced pull", async () => {
    editProfile({ ledgerSyncSupport: "other-support" });
    ledgerSync.serve(accounts([ETH_ACCOUNT], 6), () =>
      editProfile({ ledgerSyncVersion: 8, ledgerSyncSupport: "newer-support" }),
    );

    await sync();

    expect(ledgerSync.pulls.map(p => p.version)).toEqual([null]);
    expect(savedSession().accounts).toHaveLength(1);
    expect(savedProfile()).toMatchObject({
      ledgerSyncVersion: 8,
      ledgerSyncSupport: "newer-support",
    });
  });

  it("keeps an account another command added during the pull", async () => {
    const addedMeanwhile = { label: "added-meanwhile", descriptor: MOCK_SOL_DESCRIPTOR };
    ledgerSync.serve(accounts([ETH_ACCOUNT], 6), () =>
      writeFileSync(
        fixture.sessionPath,
        YAML.stringify({ ...savedSession(), accounts: [addedMeanwhile] }),
      ),
    );

    await sync();

    expect(savedSession().accounts.map(a => a.label)).toEqual([
      "added-meanwhile",
      expect.any(String),
    ]);
  });

  it.each([
    [
      "had its access changed",
      () => editProfile({ accountAccess: { ...ACCOUNT_ACCESS, trustchainId: "another-root" } }),
    ],
    ["was removed", () => writeFileSync(fixture.sessionPath, YAML.stringify({ accounts: [] }))],
  ])("saves nothing when the profile %s while syncing", async (_case, change) => {
    ledgerSync.serve(accounts([ETH_ACCOUNT], 42), change);

    const { json, exitCode } = await syncJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/changed while this sync was running.*nothing was saved/s);
    expect(savedSession().accounts).toEqual([]);
  });

  it("clears the cached version when the remote document was deleted", async () => {
    ledgerSync.serve({ json: { status: "no-data" } });

    const { stdout, exitCode } = await sync();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Up to date. Nothing to import.");
    expect(savedProfile()?.ledgerSyncVersion).toBeUndefined();
  });

  it("keeps the version a concurrent sync cached when this pull saw a deletion", async () => {
    ledgerSync.serve({ json: { status: "no-data" } }, () => editProfile({ ledgerSyncVersion: 8 }));

    await sync();

    expect(savedProfile()?.ledgerSyncVersion).toBe(8);
  });

  it("clears the cached version when a forced pull after a support change finds no document", async () => {
    editProfile({ ledgerSyncSupport: "other-support" });
    ledgerSync.serve({ json: { status: "no-data" } });

    await sync();

    expect(ledgerSync.pulls.map(p => p.version)).toEqual([null]);
    expect(savedProfile()?.ledgerSyncVersion).toBeUndefined();
  });

  it("reports a document without an account list as invalid, without saving anything", async () => {
    ledgerSync.serve(syncedDocument({ notAccounts: true }, 42));
    const before = sessionFile();

    const { json, exitCode } = await syncJson();

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({
      command: "agent-intent sync",
      invalid: [
        {
          status: "invalid",
          id: "<account list>",
          reason: "the synced document has no `accounts` list",
        },
      ],
    });
    expect(sessionFile()).toBe(before);
  });

  it("never prints the agent secret key", async () => {
    ledgerSync.serve(accounts([ETH_ACCOUNT], 9));

    const human = await sync();
    const json = await sync("--output", "json");

    const printed = [human.stdout, human.stderr, json.stdout, json.stderr].join("");
    expect(printed).not.toContain(fixture.agent.exportSecretKey());
  });
});
