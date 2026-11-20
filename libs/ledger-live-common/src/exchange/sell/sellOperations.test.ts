import type { Account, Operation } from "@ledgerhq/types-live";
import { addSellOperation, isSellOperation } from "./sellOperations";

const makeAccount = (overrides: Partial<Account> = {}): Account =>
  ({ id: "account-1", pendingOperations: [], ...overrides }) as Account;

const makeOperation = (overrides: Partial<Operation> = {}): Operation =>
  ({ id: "op-1", hash: "hash-1", accountId: "account-1", ...overrides }) as Operation;

describe("addSellOperation", () => {
  it("records the operation id", () => {
    const account = addSellOperation(makeAccount(), makeOperation());

    expect(account.sellOperationIds).toEqual(["op-1"]);
  });

  it("adds the operation to the pending operations", () => {
    const operation = makeOperation();

    const account = addSellOperation(makeAccount(), operation);

    expect(account.pendingOperations).toEqual([operation]);
  });

  it("records token sub operation ids alongside the parent id", () => {
    const operation = makeOperation({ subOperations: [makeOperation({ id: "token-op-1" })] });

    const account = addSellOperation(makeAccount(), operation);

    expect(account.sellOperationIds).toEqual(["op-1", "token-op-1"]);
  });

  it("returns the same account when the operation is already recorded", () => {
    const account = makeAccount({ sellOperationIds: ["op-1"] });

    expect(addSellOperation(account, makeOperation())).toBe(account);
  });
});

describe("isSellOperation", () => {
  it("returns true for a recorded operation", () => {
    const account = makeAccount({ sellOperationIds: ["op-1"] });

    expect(isSellOperation(account, makeOperation())).toBe(true);
  });

  it("returns false for an unknown operation or an account without sell operations", () => {
    expect(isSellOperation(makeAccount({ sellOperationIds: ["op-2"] }), makeOperation())).toBe(
      false,
    );
    expect(isSellOperation(makeAccount(), makeOperation())).toBe(false);
  });
});
