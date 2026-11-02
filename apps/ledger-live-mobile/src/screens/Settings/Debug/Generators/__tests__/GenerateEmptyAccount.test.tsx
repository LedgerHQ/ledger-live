import { createEmptyActivityAccount } from "../GenerateEmptyAccount";

describe("createEmptyActivityAccount", () => {
  it("should create an Ethereum account with no transactions", () => {
    const account = createEmptyActivityAccount();

    expect(account.currency.id).toBe("ethereum");
    expect(account.index).toBe(40);
    expect(account.operations).toEqual([]);
    expect(account.pendingOperations).toEqual([]);
    expect(account.subAccounts).toEqual([]);
    expect(account.balance.isZero()).toBe(true);
    expect(account.spendableBalance.isZero()).toBe(true);
  });
});
