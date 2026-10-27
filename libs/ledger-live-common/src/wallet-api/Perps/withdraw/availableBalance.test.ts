import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getPerpsAvailableBalance } from "./availableBalance";

const hyperCoreAccount = (spendableBalance: string): Account =>
  ({
    type: "Account",
    id: "js:2:hypercore:0xhl:",
    currency: { id: "hypercore", units: [{ name: "USDC", code: "USDC", magnitude: 6 }] },
    spendableBalance: new BigNumber(spendableBalance),
  }) as unknown as Account;

describe("getPerpsAvailableBalance", () => {
  it("reads the spendable USDC (account value minus used margin) in whole USDC", () => {
    expect(getPerpsAvailableBalance(hyperCoreAccount("1000500000"))).toEqual(
      new BigNumber("1000.5"),
    );
  });

  it("returns zero for an empty account", () => {
    expect(getPerpsAvailableBalance(hyperCoreAccount("0"))).toEqual(new BigNumber(0));
  });

  it("keeps sub-cent precision", () => {
    expect(getPerpsAvailableBalance(hyperCoreAccount("1"))).toEqual(new BigNumber("0.000001"));
  });
});
