import { describe, expect, it } from "bun:test";
import { Session } from "../session/session-store";
import type { MemberCredentials, Trustchain, TrustchainSDK } from "@shared/cloud-sync";
import {
  mergeSyncedAccounts,
  pullSyncedAccounts,
  type CreateCloudSyncSdk,
} from "./cloud-sync-accounts";
import { parseV1 } from "../shared/accountDescriptor";
import { XPUB, ETH_ADDR, SOL_ADDR } from "../shared/accountDescriptor/test-fixtures";

const BTC_RAW = {
  id: `js:2:bitcoin:${XPUB}:native_segwit`,
  currencyId: "bitcoin",
  freshAddress: "bc1qexample",
  seedIdentifier: XPUB,
  derivationMode: "native_segwit",
  index: 0,
};

const ETH_RAW = {
  id: `js:2:ethereum:${ETH_ADDR}:ethM`,
  currencyId: "ethereum",
  freshAddress: ETH_ADDR,
  seedIdentifier: ETH_ADDR,
  derivationMode: "ethM",
  index: 0,
};

// Not a currencyId known to the crypto-currency registry at all — toV1() throws
// UnknownNetworkError, which mergeSyncedAccounts must classify as "skipped".
const UNSUPPORTED_RAW = {
  id: "js:2:not-a-real-currency:xExample:default",
  currencyId: "not-a-real-currency",
  freshAddress: "xExample",
  seedIdentifier: "xExample",
  derivationMode: "default",
  index: 0,
};

// A real, known currencyId (verified against @domain/entity-currency-crypto: resolves with
// family "polkadot") whose family wallet-cli simply has no transaction-family support for.
// Distinct from UNSUPPORTED_RAW above: this one *would* convert to a valid AccountDescriptorV1
// (toV1 would not throw), so it must be caught by the family allowlist before ever reaching toV1().
const UNSUPPORTED_FAMILY_RAW = {
  id: "js:2:polkadot:5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty:polkadotbip44",
  currencyId: "polkadot",
  freshAddress: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  seedIdentifier: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  derivationMode: "polkadotbip44",
  index: 0,
};

// Fails accountDescriptorSchema itself (missing required fields) — must be isolated as "invalid"
// without affecting any other entry in the same import.
const MALFORMED_RAW = { id: "not-a-real-descriptor" };

// Passes accountDescriptorSchema (seedIdentifier has no .min(1) there) but produces a structurally
// invalid V1 descriptor (empty `address`) once toV1() copies it verbatim — real data seen from a
// live Ledger Sync pull. Must be isolated as "invalid", never silently written into the session.
const EMPTY_ADDRESS_RAW = {
  id: "js:2:ethereum::ethM",
  currencyId: "ethereum",
  freshAddress: "",
  seedIdentifier: "",
  derivationMode: "ethM",
  index: 0,
};

describe("mergeSyncedAccounts", () => {
  it("imports a new, supported account and adds it to the session", () => {
    const session = Session.from([]);
    const report = mergeSyncedAccounts(session, [ETH_RAW]);

    expect(report.imported).toEqual([
      expect.objectContaining({ status: "imported", network: "ethereum:main" }),
    ]);
    expect(report.unchanged).toEqual([]);
    expect(report.skipped).toEqual([]);
    expect(report.invalid).toEqual([]);
    expect(session.accounts).toHaveLength(1);
  });

  it("is idempotent on repeat import: no duplicate, no relabel, reported as unchanged", () => {
    const session = Session.from([]);
    const first = mergeSyncedAccounts(session, [ETH_RAW]);
    const firstLabel = first.imported[0]?.label;

    const second = mergeSyncedAccounts(session, [ETH_RAW]);

    expect(session.accounts).toHaveLength(1);
    expect(second.imported).toEqual([]);
    expect(second.unchanged).toEqual([
      expect.objectContaining({ status: "unchanged", label: firstLabel }),
    ]);
  });

  it("is additive: importing a second account never removes the first", () => {
    const session = Session.from([]);
    mergeSyncedAccounts(session, [ETH_RAW]);
    mergeSyncedAccounts(session, [BTC_RAW]);

    expect(session.accounts).toHaveLength(2);
  });

  it("reports an unresolvable currencyId as skipped, not invalid, without dropping other entries", () => {
    const session = Session.from([]);
    const report = mergeSyncedAccounts(session, [UNSUPPORTED_RAW, ETH_RAW]);

    expect(report.skipped).toEqual([
      expect.objectContaining({ status: "skipped", id: UNSUPPORTED_RAW.id }),
    ]);
    expect(report.invalid).toEqual([]);
    expect(report.imported).toEqual([expect.objectContaining({ status: "imported" })]);
    expect(session.accounts).toHaveLength(1);
  });

  it("reports a resolvable but wallet-cli-unsupported currency family as skipped, before toV1()", () => {
    const session = Session.from([]);
    const report = mergeSyncedAccounts(session, [UNSUPPORTED_FAMILY_RAW, ETH_RAW]);

    expect(report.skipped).toEqual([
      expect.objectContaining({ status: "skipped", id: UNSUPPORTED_FAMILY_RAW.id }),
    ]);
    expect(report.skipped[0]?.reason).toContain("polkadot");
    expect(report.invalid).toEqual([]);
    expect(report.imported).toEqual([expect.objectContaining({ status: "imported" })]);
    expect(session.accounts).toHaveLength(1);
  });

  it("isolates a schema-invalid entry without discarding valid entries in the same import", () => {
    const session = Session.from([]);
    const report = mergeSyncedAccounts(session, [MALFORMED_RAW, ETH_RAW, BTC_RAW]);

    expect(report.invalid).toEqual([
      expect.objectContaining({ status: "invalid", id: "not-a-real-descriptor" }),
    ]);
    expect(report.imported).toHaveLength(2);
    expect(session.accounts).toHaveLength(2);
  });

  it("isolates a toV1() output that fails the V1 schema (empty address) as invalid, never persisting it", () => {
    const session = Session.from([]);
    const report = mergeSyncedAccounts(session, [EMPTY_ADDRESS_RAW, ETH_RAW]);

    expect(report.invalid).toEqual([
      expect.objectContaining({ status: "invalid", id: EMPTY_ADDRESS_RAW.id }),
    ]);
    expect(report.imported).toEqual([expect.objectContaining({ status: "imported" })]);
    expect(session.accounts).toHaveLength(1);
    // The one persisted entry must round-trip through parseV1() — this is the exact invariant the
    // empty-address bug violated (a descriptor that looked fine in `session view` but threw here).
    expect(() => parseV1(session.accounts[0]!.descriptor)).not.toThrow();
  });

  // Real Ledger Sync entries carry live-common's seedIdentifier: the public key of the seed
  // derivation, not the account's address (which only lives in the id). ETH_RAW hides this because
  // its seedIdentifier happens to equal the address.
  it.each([
    {
      name: "ethereum",
      raw: {
        ...ETH_RAW,
        seedIdentifier:
          "046b1e2f6e7c2a4b8f0d7c9e1a3b5d7f9e1c3a5b7d9f1e3c5a7b9d1f3e5c7a9b1d3f5e7c9a1b3d5f7e9c1a3b5d7f9e1c3a5b7d9f1e3c5a7b9d1f3e5c7a9b1d",
      },
      address: ETH_ADDR,
    },
    {
      name: "solana",
      raw: {
        id: `js:2:solana:${SOL_ADDR}:solanaMain`,
        currencyId: "solana",
        freshAddress: SOL_ADDR,
        seedIdentifier: "So11111111111111111111111111111111111111112",
        derivationMode: "solanaMain",
        index: 0,
      },
      address: SOL_ADDR,
    },
  ])(
    "persists the $name account address from the id, not the seedIdentifier",
    ({ raw, address }) => {
      const session = Session.from([]);
      const report = mergeSyncedAccounts(session, [raw]);

      expect(report.invalid).toEqual([]);
      expect(session.accounts.map(({ descriptor }) => parseV1(descriptor))).toEqual([
        expect.objectContaining({ type: "address", address }),
      ]);
    },
  );

  it("keeps the xpub of a bitcoin account", () => {
    const session = Session.from([]);
    mergeSyncedAccounts(session, [{ ...BTC_RAW, seedIdentifier: "02a1b2c3d4e5f6" }]);

    expect(session.accounts.map(({ descriptor }) => parseV1(descriptor))).toEqual([
      expect.objectContaining({ type: "utxo", xpub: XPUB }),
    ]);
  });

  it.each([
    { name: "currency", id: `js:2:solana:${SOL_ADDR}:solanaMain` },
    { name: "derivation mode", id: `js:2:ethereum:${ETH_ADDR}:` },
  ])("isolates an entry whose id names a different $name than its fields as invalid", ({ id }) => {
    const session = Session.from([]);
    const mismatched = { ...ETH_RAW, id };
    const report = mergeSyncedAccounts(session, [mismatched, BTC_RAW]);

    expect(report.invalid).toEqual([expect.objectContaining({ status: "invalid", id })]);
    expect(report.imported).toEqual([expect.objectContaining({ network: "bitcoin:main" })]);
  });

  it("gives a synced account a fresh label when its default one is taken by a different local account", () => {
    const localOnly = { label: "ethereum-1", descriptor: "local-only-descriptor" };
    const session = Session.from([localOnly]);

    const report = mergeSyncedAccounts(session, [ETH_RAW]);

    expect(report.imported).toEqual([
      expect.objectContaining({ status: "imported", label: "ethereum-2" }),
    ]);
    expect(session.accounts[0]).toEqual(localOnly);
    expect(session.accounts).toHaveLength(2);
  });

  it("returns an empty report and touches nothing for an empty pull", () => {
    const session = Session.from([]);
    const report = mergeSyncedAccounts(session, []);

    expect(report.imported).toEqual([]);
    expect(report.unchanged).toEqual([]);
    expect(report.skipped).toEqual([]);
    expect(report.invalid).toEqual([]);
    expect(session.accounts).toHaveLength(0);
  });
});

function namedError(name: string): Error {
  const err = new Error(name);
  err.name = name;
  return err;
}

describe("pullSyncedAccounts", () => {
  const trustchain = { rootId: "root-abc" } as unknown as Trustchain;
  const memberCredentials = { privatekey: "priv", pubkey: "pub" } as MemberCredentials;
  const trustchainSdk = {} as TrustchainSDK;

  type SdkOptions = Parameters<CreateCloudSyncSdk>[0];

  /** A fake CloudSyncSDK whose pull() replays `events` through saveNewUpdate, then optionally throws. */
  function fakeSdk(events: unknown[], thenThrow?: Error) {
    const created: SdkOptions[] = [];
    const createSdk: CreateCloudSyncSdk = options => {
      created.push(options);
      return {
        pull: async () => {
          for (const event of events) await options.saveNewUpdate(event as never);
          if (thenThrow) throw thenThrow;
        },
      };
    };
    return { created, createSdk };
  }

  it("reports up-to-date when the pull delivers no update", async () => {
    const { createSdk } = fakeSdk([]);

    const result = await pullSyncedAccounts(
      trustchain,
      memberCredentials,
      trustchainSdk,
      "production",
      () => 5,
      createSdk,
    );

    expect(result).toEqual({ status: "up-to-date" });
  });

  it("returns the raw accounts and version of a new-data update", async () => {
    const { createSdk } = fakeSdk([
      { type: "new-data", data: { accounts: [ETH_RAW, MALFORMED_RAW] }, version: 7 },
    ]);

    const result = await pullSyncedAccounts(
      trustchain,
      memberCredentials,
      trustchainSdk,
      "production",
      () => undefined,
      createSdk,
    );

    // Not validated here: per-entry validation happens in mergeSyncedAccounts.
    expect(result).toEqual({ status: "new-data", accounts: [ETH_RAW, MALFORMED_RAW], version: 7 });
  });

  it.each([
    ["a non-array", "nope"],
    ["a missing", undefined],
  ])(
    "reports %s accounts field as malformed, without a version to cache",
    async (_label, accounts) => {
      const { createSdk } = fakeSdk([{ type: "new-data", data: { accounts }, version: 2 }]);

      const result = await pullSyncedAccounts(
        trustchain,
        memberCredentials,
        trustchainSdk,
        "production",
        () => undefined,
        createSdk,
      );

      expect(result).toEqual({ status: "malformed", reason: expect.stringContaining("accounts") });
    },
  );

  it("swallows the TrustchainOutdated the SDK throws right after reporting deleted data", async () => {
    const { createSdk } = fakeSdk([{ type: "deleted-data" }], namedError("TrustchainOutdated"));

    const result = await pullSyncedAccounts(
      trustchain,
      memberCredentials,
      trustchainSdk,
      "production",
      () => 3,
      createSdk,
    );

    expect(result).toEqual({ status: "deleted" });
  });

  it("rethrows a TrustchainOutdated raised before any deletion was recorded", async () => {
    const failure = namedError("TrustchainOutdated");
    const { createSdk } = fakeSdk([], failure);

    await expect(
      pullSyncedAccounts(
        trustchain,
        memberCredentials,
        trustchainSdk,
        "production",
        () => 3,
        createSdk,
      ),
    ).rejects.toBe(failure);
  });

  it("rethrows any other pull failure instead of reporting a partial result", async () => {
    const failure = namedError("NetworkError");
    const { createSdk } = fakeSdk([], failure);

    await expect(
      pullSyncedAccounts(
        trustchain,
        memberCredentials,
        trustchainSdk,
        "production",
        () => 3,
        createSdk,
      ),
    ).rejects.toBe(failure);
  });

  it("targets the Cloud Sync backend of the environment it was given, never the other one", async () => {
    const production = fakeSdk([]);
    const staging = fakeSdk([]);

    await pullSyncedAccounts(
      trustchain,
      memberCredentials,
      trustchainSdk,
      "production",
      () => 1,
      production.createSdk,
    );
    await pullSyncedAccounts(
      trustchain,
      memberCredentials,
      trustchainSdk,
      "staging",
      () => 1,
      staging.createSdk,
    );

    expect(production.created).toEqual([
      expect.objectContaining({ apiBaseUrl: "https://cloud-sync.api.live.ledger.com" }),
    ]);
    expect(staging.created).toEqual([
      expect.objectContaining({
        apiBaseUrl: "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
      }),
    ]);
  });

  it("passes the caller's cached version and the shared live slug to the SDK", async () => {
    const { created, createSdk } = fakeSdk([]);

    await pullSyncedAccounts(
      trustchain,
      memberCredentials,
      trustchainSdk,
      "production",
      () => 42,
      createSdk,
    );

    expect(created[0]?.getCurrentVersion()).toBe(42);
    expect(created[0]?.slug).toBe("live");
    expect(created[0]?.trustchainSdk).toBe(trustchainSdk);
  });
});
