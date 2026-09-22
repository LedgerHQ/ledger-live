import { describe, expect, it } from "bun:test";
import { Session } from "../session/session-store";
import { mergeSyncedAccounts } from "./cloud-sync-accounts";
import { parseV1 } from "../shared/accountDescriptor";
import { XPUB, ETH_ADDR } from "../shared/accountDescriptor/test-fixtures";

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
