import { BigNumber } from "bignumber.js";
import type { JsonSafeRecord } from "../../../bridge/generic-coin-framework/types";
import type { BitcoinFamilySpecificData } from "../types";
import { isStrategyDisabled } from "./isStrategyDisabled";

const transactionToUpdate = (
  familySpecificData?: BitcoinFamilySpecificData,
  feeParameters?: JsonSafeRecord,
) => ({
  ...(familySpecificData ? { familySpecificData } : {}),
  ...(feeParameters ? { feeParameters } : {}),
});

describe("isStrategyDisabled", () => {
  it("should return true if the strategy's fee rate is lower than the minimum fee rate", () => {
    const transaction = transactionToUpdate({ rbf: true, feePerByte: "100" });
    const feesStrategy = new BigNumber(90);
    expect(isStrategyDisabled({ transaction, feesStrategy })).toBe(true);
  });

  it("should return true if the strategy's fee rate is just below the minimum fee rate", () => {
    // 100 → min 110
    const transaction = transactionToUpdate({ rbf: true, feePerByte: "100" });
    expect(isStrategyDisabled({ transaction, feesStrategy: new BigNumber(109) })).toBe(true);
    expect(isStrategyDisabled({ transaction, feesStrategy: new BigNumber(110) })).toBe(false);
  });

  it("should return false if the strategy's fee rate is higher than the minimum fee rate", () => {
    const transaction = transactionToUpdate({ rbf: true, feePerByte: "1200000000" });
    const feesStrategy = new BigNumber(1320000000);
    expect(isStrategyDisabled({ transaction, feesStrategy })).toBe(false);
  });

  it("should compare against the estimated rate (feeParameters) before the custom one", () => {
    const transaction = transactionToUpdate({ rbf: true, feePerByte: "1" }, { feePerByte: "100" });
    expect(isStrategyDisabled({ transaction, feesStrategy: new BigNumber(50) })).toBe(true);
    expect(isStrategyDisabled({ transaction, feesStrategy: new BigNumber(110) })).toBe(false);
  });

  it("should return true if RBF is explicitly disabled", () => {
    const transaction = transactionToUpdate({ rbf: false, feePerByte: "100000000" });
    const feesStrategy = new BigNumber(150000000);
    expect(isStrategyDisabled({ transaction, feesStrategy })).toBe(true);
  });

  it("should return true if the transaction carries no familySpecificData", () => {
    const transaction = transactionToUpdate(undefined, { feePerByte: "100" });
    expect(isStrategyDisabled({ transaction, feesStrategy: new BigNumber(500) })).toBe(true);
  });

  it("should ignore the legacy top-level rbf and feePerByte fields", () => {
    const transaction = { rbf: true, feePerByte: new BigNumber(100) } as never;
    expect(isStrategyDisabled({ transaction, feesStrategy: new BigNumber(500) })).toBe(true);
  });

  it.each([undefined, "", "not-a-number"])(
    "should return true if the original fee rate is unknown (%p)",
    feePerByte => {
      const transaction = transactionToUpdate({
        rbf: true,
        ...(feePerByte === undefined ? {} : { feePerByte }),
      });
      expect(isStrategyDisabled({ transaction, feesStrategy: new BigNumber(500) })).toBe(true);
    },
  );

  it("should compare a zero original fee rate to the minimum bump", () => {
    // a zero rate is a known rate: the strategy must reach the +1 sat/vB bump
    const transaction = transactionToUpdate({ rbf: true, feePerByte: "0" });
    expect(isStrategyDisabled({ transaction, feesStrategy: new BigNumber(0.5) })).toBe(true);
    expect(isStrategyDisabled({ transaction, feesStrategy: new BigNumber(1) })).toBe(false);
  });

  it("should return true if no strategy fee rate is given", () => {
    const transaction = transactionToUpdate({ rbf: true, feePerByte: "100" });
    expect(
      isStrategyDisabled({ transaction, feesStrategy: undefined as unknown as BigNumber }),
    ).toBe(true);
  });

  it.each([new BigNumber(-1), new BigNumber(0)])(
    "should return true if the strategy's fee rate is less than or equal to 0",
    feesStrategy => {
      const transaction = transactionToUpdate({ rbf: true, feePerByte: "100" });

      expect(isStrategyDisabled({ transaction, feesStrategy })).toBe(true);
    },
  );
});
