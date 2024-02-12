import BigNumber from "bignumber.js";
import { isStrategyDisabled } from "../../../editTransaction/isStrategyDisabled";

describe("isStrategyDisabled", () => {
  describe("EIP1559 transaction (type 2)", () => {
    it("should return true if the strategy's fees are lower than the minimum fees", () => {
      const transaction = {
        type: 2,
        maxFeePerGas: new BigNumber("500000000"),
        maxPriorityFeePerGas: new BigNumber("100000000"),
      } as any;
      const feeData = {
        maxFeePerGas: new BigNumber("50000000"),
        maxPriorityFeePerGas: new BigNumber("10000000"),
      } as any;
      expect(isStrategyDisabled({ transaction, feeData })).toBe(true);
    });

    it("should return false if the strategy's fees are higer than the minimum fees", () => {
      const transaction = {
        type: 2,
        maxFeePerGas: new BigNumber("50000000"),
        maxPriorityFeePerGas: new BigNumber("10000000"),
      } as any;
      const feeData = {
        maxFeePerGas: new BigNumber("500000000"),
        maxPriorityFeePerGas: new BigNumber("100000000"),
      } as any;
      expect(isStrategyDisabled({ transaction, feeData })).toBe(false);
    });

    it("should return false if feeData.maxFeePerGas not provided", () => {
      const transaction = {
        type: 2,
        maxFeePerGas: new BigNumber("50000000"),
        maxPriorityFeePerGas: new BigNumber("10000000"),
      } as any;
      const feeData = {
        maxFeePerGas: null,
        maxPriorityFeePerGas: new BigNumber("100000000"),
      } as any;
      expect(isStrategyDisabled({ transaction, feeData })).toBe(false);
    });

    it("should return false if feeData.maxPriorityFeePerGas not provided", () => {
      const transaction = {
        type: 2,
        maxFeePerGas: new BigNumber("50000000"),
        maxPriorityFeePerGas: new BigNumber("10000000"),
      } as any;
      const feeData = {
        maxFeePerGas: new BigNumber("500000000"),
        maxPriorityFeePerGas: null,
      } as any;
      expect(isStrategyDisabled({ transaction, feeData })).toBe(false);
    });
  });

  describe("Legacy transaction (type 0 or 1)", () => {
    it("should return true if the strategy's gas price is lower than the minimum gas price", () => {
      const transaction = {
        type: 1,
        gasPrice: new BigNumber("1000000000"),
      } as any;
      const feeData = {
        gasPrice: new BigNumber("500000000"),
      } as any;
      expect(isStrategyDisabled({ transaction, feeData })).toBe(true);
    });

    it("should return false if the strategy's gas price is higher than the minimum gas price", () => {
      const transaction = {
        type: 1,
        gasPrice: new BigNumber("100000000"),
      } as any;
      const feeData = {
        gasPrice: new BigNumber("500000000"),
      } as any;
      expect(isStrategyDisabled({ transaction, feeData })).toBe(false);
    });

    it("should return false if feeData.gasPrice not provided", () => {
      const transaction = {
        type: 1,
        gasPrice: new BigNumber("100000000"),
      } as any;
      const feeData = {
        gasPrice: null,
      } as any;
      expect(isStrategyDisabled({ transaction, feeData })).toBe(false);
    });
  });
});
