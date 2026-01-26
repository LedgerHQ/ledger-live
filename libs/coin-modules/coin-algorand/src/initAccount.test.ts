import { BigNumber } from "bignumber.js";
import { initAccount } from "./initAccount";
import type { AlgorandAccount } from "./types";

describe("initAccount", () => {
  it("should initialize algorandResources with zero rewards", () => {
    const account = {} as AlgorandAccount;

    initAccount(account);

    expect(account.algorandResources).not.toBeUndefined();
    expect(account.algorandResources?.rewards).toBeInstanceOf(BigNumber);
    expect(account.algorandResources?.rewards.toString()).toBe("0");
  });

  it("should set nbAssets to 0 when no subAccounts", () => {
    const account = {} as AlgorandAccount;

    initAccount(account);

    expect(account.algorandResources?.nbAssets).toBe(0);
  });

  it("should set nbAssets to subAccounts length", () => {
    const account = {
      subAccounts: [{ id: "sub1" }, { id: "sub2" }, { id: "sub3" }],
    } as unknown as AlgorandAccount;

    initAccount(account);

    expect(account.algorandResources?.nbAssets).toBe(3);
  });

  it("should handle empty subAccounts array", () => {
    const account = {
      subAccounts: [],
    } as unknown as AlgorandAccount;

    initAccount(account);

    expect(account.algorandResources?.nbAssets).toBe(0);
  });

  it("should handle undefined subAccounts", () => {
    const account = {
      subAccounts: undefined,
    } as AlgorandAccount;

    initAccount(account);

    expect(account.algorandResources?.nbAssets).toBe(0);
  });

  it("should overwrite existing algorandResources", () => {
    const account = {
      algorandResources: {
        rewards: new BigNumber("1000000"),
        nbAssets: 5,
      },
      subAccounts: [{ id: "sub1" }],
    } as unknown as AlgorandAccount;

    initAccount(account);

    expect(account.algorandResources?.rewards.toString()).toBe("0");
    expect(account.algorandResources?.nbAssets).toBe(1);
  });

  it("should handle account with many subAccounts", () => {
    const subAccounts = Array.from({ length: 100 }, (_, i) => ({ id: `sub${i}` }));
    const account = { subAccounts } as unknown as AlgorandAccount;

    initAccount(account);

    expect(account.algorandResources?.nbAssets).toBe(100);
  });
});
