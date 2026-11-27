import BigNumber from "bignumber.js";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { Account, Operation } from "@ledgerhq/types-live";
import { findOperationByIdOrHash } from "../findOperation";

const ACCOUNT_ID = "js:2:ethereum:0xabc:";
const HASH = "0xhash";

const makeOperation = (overrides: Partial<Operation>): Operation => ({
  id: `${ACCOUNT_ID}-${HASH}-OUT`,
  hash: HASH,
  accountId: ACCOUNT_ID,
  type: "OUT",
  value: new BigNumber(0),
  fee: new BigNumber(100),
  senders: ["sender"],
  recipients: ["recipient"],
  blockHash: null,
  blockHeight: null,
  date: new Date(),
  extra: {},
  ...overrides,
});

const makeAccount = (overrides: Partial<Account>): Account => ({
  ...createFixtureAccount(),
  id: ACCOUNT_ID,
  operations: [],
  pendingOperations: [],
  ...overrides,
});

const pendingOut = makeOperation({});
const confirmedFees = makeOperation({ id: `${ACCOUNT_ID}-${HASH}-FEES`, type: "FEES" });
const otherOperation = makeOperation({ id: `${ACCOUNT_ID}-0xother-OUT`, hash: "0xother" });

describe("findOperationByIdOrHash", () => {
  it("should return the operation with the requested id", () => {
    const account = makeAccount({ operations: [confirmedFees, otherOperation] });

    expect(findOperationByIdOrHash(account, confirmedFees.id)).toBe(confirmedFees);
  });

  it("should return the confirmed operation with the same hash when the id is gone", () => {
    const account = makeAccount({ operations: [confirmedFees] });

    expect(findOperationByIdOrHash(account, pendingOut.id)).toBe(confirmedFees);
  });

  it("should return the pending operation with the same hash when only pending operations remain", () => {
    const pendingFees = makeOperation({ id: `${ACCOUNT_ID}-${HASH}-FEES`, type: "FEES" });
    const account = makeAccount({ pendingOperations: [pendingFees] });

    expect(findOperationByIdOrHash(account, pendingOut.id)).toBe(pendingFees);
  });

  it("should prefer the confirmed operation over a pending one with the same hash", () => {
    const account = makeAccount({ operations: [confirmedFees], pendingOperations: [pendingOut] });

    expect(findOperationByIdOrHash(account, `${ACCOUNT_ID}-${HASH}-IN`)).toBe(confirmedFees);
  });

  it("should return null when no operation matches the id or the hash", () => {
    const account = makeAccount({ operations: [otherOperation] });

    expect(findOperationByIdOrHash(account, pendingOut.id)).toBeNull();
  });

  it("should not match an internal operation that shares the hash of its parent", () => {
    const parent = makeOperation({
      id: `${ACCOUNT_ID}-0xparent-OUT`,
      hash: "0xparent",
      internalOperations: [makeOperation({ id: "internal-1", hash: HASH })],
    });
    const account = makeAccount({ operations: [parent] });

    expect(findOperationByIdOrHash(account, pendingOut.id)).toBeNull();
  });

  it("should find the operation when the account id contains hyphens", () => {
    const hyphenatedAccountId = "js:2:internet_computer:abc-def-ghi:";
    const pending = makeOperation({
      id: `${hyphenatedAccountId}-${HASH}-OUT`,
      accountId: hyphenatedAccountId,
    });
    const confirmed = makeOperation({
      id: `${hyphenatedAccountId}-${HASH}-FEES`,
      accountId: hyphenatedAccountId,
      type: "FEES",
    });
    const account = makeAccount({ id: hyphenatedAccountId, operations: [confirmed] });

    expect(findOperationByIdOrHash(account, pending.id)).toBe(confirmed);
  });
});
