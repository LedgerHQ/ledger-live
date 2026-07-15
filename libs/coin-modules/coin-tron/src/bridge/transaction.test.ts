import BigNumber from "bignumber.js";
import type { TransactionStatusRaw } from "../types";
import { fromTransactionStatusRaw } from "./transaction";

describe("fromTransactionStatusRaw", () => {
  it("defaults the live-derived resource fields to 0 (they are not persisted in Raw)", () => {
    const raw = {
      errors: {},
      warnings: {},
      estimatedFees: "0",
      amount: "0",
      totalSpent: "0",
    } as unknown as TransactionStatusRaw;

    const status = fromTransactionStatusRaw(raw);

    expect(status.energyRequired).toEqual(new BigNumber(0));
    expect(status.energyAvailable).toEqual(new BigNumber(0));
    expect(status.bandwidthRequired).toEqual(new BigNumber(0));
    expect(status.bandwidthAvailable).toEqual(new BigNumber(0));
  });
});
