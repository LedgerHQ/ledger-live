import BigNumber from "bignumber.js";
import { sortAccountsByBalance } from "../useDetailedAccounts";

const balanceA = new BigNumber(100);
const balanceB = new BigNumber(200);
const balanceC = new BigNumber(300);
const balance0 = new BigNumber(0);
const balanceUndefined = undefined;

describe("sortAccountsByBalance", () => {
  it("should sort accounts by balance in descending order", () => {
    const accountA = { balance: balanceA };
    const accountB = { balance: balanceB };
    const accountC = { balance: balanceC };

    expect(sortAccountsByBalance(accountA, accountB)).toBe(1);
    expect(sortAccountsByBalance(accountB, accountA)).toBe(-1);
    expect(sortAccountsByBalance(accountA, accountC)).toBe(1);
    expect(sortAccountsByBalance(accountC, accountA)).toBe(-1);
    expect(sortAccountsByBalance(accountB, accountC)).toBe(1);
    expect(sortAccountsByBalance(accountC, accountB)).toBe(-1);
  });

  it("should return -1 for accountA with balance and accountB with undefined balance", () => {
    const accountA = { balance: balanceA };
    const accountB = balanceUndefined;

    expect(sortAccountsByBalance(accountA, accountB)).toBe(-1);
  });

  it("should return 1 for accountA with undefined balance and accountB with balance", () => {
    const accountA = balanceUndefined;
    const accountB = { balance: balanceB };

    expect(sortAccountsByBalance(accountA, accountB)).toBe(1);
  });

  it("should return -1 for accountA with balance 0 and accountB with undefined balance", () => {
    const accountA = { balance: balance0 };
    const accountB = balanceUndefined;

    expect(sortAccountsByBalance(accountA, accountB)).toBe(-1);
  });

  it("should return 1 for accountA with undefined balance and accountB with balance 0", () => {
    const accountA = balanceUndefined;
    const accountB = { balance: balance0 };

    expect(sortAccountsByBalance(accountA, accountB)).toBe(1);
  });

  it("should return 0 for two undefined accounts", () => {
    const accountA = balanceUndefined;
    const accountB = balanceUndefined;

    expect(sortAccountsByBalance(accountA, accountB)).toBe(0);
  });

  it("should return sorted accounts by balance in descending order", () => {
    const accountA = { balance: balanceA };
    const accountB = { balance: balanceB };
    const accountC = { balance: balanceC };

    const accounts = [accountB, accountA, accountC];
    const sortedAccounts = accounts.sort(sortAccountsByBalance);
    expect(sortedAccounts).toEqual([accountC, accountB, accountA]);
  });

  it("should return sorted accounts with undefined balances at the end", () => {
    const accountA = { balance: balanceA };
    const accountB = { balance: balanceB };
    const accountC = balanceUndefined;

    const accounts = [accountB, accountA, accountC];
    const sortedAccounts = accounts.sort(sortAccountsByBalance);
    expect(sortedAccounts).toEqual([accountB, accountA, accountC]);
  });

  it("should return sorted accounts with balance 0 at the end", () => {
    const accountA = { balance: balanceA };
    const accountB = { balance: balanceB };
    const accountC = { balance: balance0 };

    const accounts = [accountB, accountA, accountC];
    const sortedAccounts = accounts.sort(sortAccountsByBalance);
    expect(sortedAccounts).toEqual([accountB, accountA, accountC]);
  });
});
