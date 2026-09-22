import { describe, expect, it } from "bun:test";
import { Session } from "../session/session-store";
import { mergeSyncedAccounts } from "./cloud-sync-accounts";
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

// Fails accountDescriptorSchema itself (missing required fields) — must be isolated as "invalid"
// without affecting any other entry in the same import.
const MALFORMED_RAW = { id: "not-a-real-descriptor" };

describe("mergeSyncedAccounts", () => {
  it("imports a new, supported account and adds it to the session", () => {
    const session = Session.from([]);
    const report = mergeSyncedAccounts(session, [ETH_RAW]);

    expect(report.imported).toHaveLength(1);
    expect(report.imported[0]?.network).toBe("ethereum:main");
    expect(report.unchanged).toHaveLength(0);
    expect(report.skipped).toHaveLength(0);
    expect(report.invalid).toHaveLength(0);
    expect(session.accounts).toHaveLength(1);
  });

  it("is idempotent on repeat import: no duplicate, no relabel, reported as unchanged", () => {
    const session = Session.from([]);
    const first = mergeSyncedAccounts(session, [ETH_RAW]);
    const firstLabel = first.imported[0]?.label;

    const second = mergeSyncedAccounts(session, [ETH_RAW]);

    expect(session.accounts).toHaveLength(1);
    expect(second.imported).toHaveLength(0);
    expect(second.unchanged).toHaveLength(1);
    expect(second.unchanged[0]?.label).toBe(firstLabel);
  });

  it("is additive: importing a second account never removes the first", () => {
    const session = Session.from([]);
    mergeSyncedAccounts(session, [ETH_RAW]);
    mergeSyncedAccounts(session, [BTC_RAW]);

    expect(session.accounts).toHaveLength(2);
  });

  it("reports an unsupported currency family as skipped, not invalid, without dropping other entries", () => {
    const session = Session.from([]);
    const report = mergeSyncedAccounts(session, [UNSUPPORTED_RAW, ETH_RAW]);

    expect(report.skipped).toHaveLength(1);
    expect(report.skipped[0]?.id).toBe(UNSUPPORTED_RAW.id);
    expect(report.invalid).toHaveLength(0);
    expect(report.imported).toHaveLength(1);
    expect(session.accounts).toHaveLength(1);
  });

  it("isolates a schema-invalid entry without discarding valid entries in the same import", () => {
    const session = Session.from([]);
    const report = mergeSyncedAccounts(session, [MALFORMED_RAW, ETH_RAW, BTC_RAW]);

    expect(report.invalid).toHaveLength(1);
    expect(report.invalid[0]?.id).toBe("not-a-real-descriptor");
    expect(report.imported).toHaveLength(2);
    expect(session.accounts).toHaveLength(2);
  });

  it("returns an empty report and touches nothing for an empty pull", () => {
    const session = Session.from([]);
    const report = mergeSyncedAccounts(session, []);

    expect(report.imported).toHaveLength(0);
    expect(report.unchanged).toHaveLength(0);
    expect(report.skipped).toHaveLength(0);
    expect(report.invalid).toHaveLength(0);
    expect(session.accounts).toHaveLength(0);
  });
});
