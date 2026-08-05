import BigNumber from "bignumber.js";
import { evmCustomFeeConfig, isEip1559 } from "./fees";

describe("evm custom fee descriptor", () => {
  describe("isEip1559", () => {
    it("should return true when transaction type is 2", () => {
      expect(isEip1559({ type: 2 })).toBe(true);
    });

    it("should return false for legacy type without EIP-1559 gasOptions", () => {
      expect(
        isEip1559({
          type: 0,
          gasPrice: new BigNumber(1_000_000_000),
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
        }),
      ).toBe(false);
    });
  });

  describe("buildTransactionPatch", () => {
    it("should force legacy type and clear EIP-1559 fields for gasPrice custom fees", () => {
      expect(evmCustomFeeConfig.buildTransactionPatch({ gasPrice: "1" })).toEqual({
        feesStrategy: "custom",
        type: 0,
        gasPrice: new BigNumber(1_000_000_000),
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      });
    });

    it("should force EIP-1559 type and clear gasPrice for max fee custom fees", () => {
      expect(
        evmCustomFeeConfig.buildTransactionPatch({
          maxFeePerGas: "20",
          maxPriorityFeePerGas: "2",
        }),
      ).toEqual({
        feesStrategy: "custom",
        type: 2,
        gasPrice: null,
        maxFeePerGas: new BigNumber(20_000_000_000),
        maxPriorityFeePerGas: new BigNumber(2_000_000_000),
      });
    });
  });

  describe("getInitialValues", () => {
    it("should expose a single gasPrice field for legacy transactions", () => {
      expect(
        evmCustomFeeConfig.getInitialValues({
          type: 0,
          gasPrice: new BigNumber(1_000_000_000),
        }),
      ).toEqual({ gasPrice: "1" });
    });

    it("should expose EIP-1559 fields for type 2 transactions", () => {
      expect(
        evmCustomFeeConfig.getInitialValues({
          type: 2,
          maxFeePerGas: new BigNumber(20_000_000_000),
          maxPriorityFeePerGas: new BigNumber(2_000_000_000),
        }),
      ).toEqual({
        maxFeePerGas: "20",
        maxPriorityFeePerGas: "2",
      });
    });
  });
});
