import BigNumber from "bignumber.js";
import {
  eip1559TransactionHasFees,
  getEstimatedFees,
  legacyTransactionHasFees,
} from "../logic";
import { EvmTransactionEIP1559, EvmTransactionLegacy } from "../types";

describe("EVM Family", () => {
  describe("logic.ts", () => {
    describe("legacyTransactionHasFees", () => {
      it("should return true for legacy tx with fees", () => {
        const tx: Partial<EvmTransactionLegacy> = {
          type: 0,
          gasPrice: new BigNumber(100),
        };

        expect(legacyTransactionHasFees(tx as EvmTransactionLegacy)).toBe(true);
      });

      it("should return false for legacy tx without fees", () => {
        const tx: Partial<EvmTransactionLegacy> = {
          type: 0,
        };

        expect(legacyTransactionHasFees(tx as any)).toBe(false);
      });

      it("should return false for legacy tx with wrong fees", () => {
        const tx: Partial<EvmTransactionEIP1559> = {
          type: 0,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
        };

        expect(legacyTransactionHasFees(tx as any)).toBe(false);
      });

      it("should return true for legacy tx with fees but no type (default being a legacy tx)", () => {
        const tx: Partial<EvmTransactionLegacy> = {
          gasPrice: new BigNumber(100),
        };

        expect(legacyTransactionHasFees(tx as any)).toBe(true);
      });
    });

    describe("eip1559TransactionHasFess", () => {
      it("should return true for 1559 tx with fees", () => {
        const tx: Partial<EvmTransactionEIP1559> = {
          type: 2,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
        };

        expect(eip1559TransactionHasFees(tx as any)).toBe(true);
      });

      it("should return false for 1559 tx without fees", () => {
        const tx: Partial<EvmTransactionEIP1559> = {
          type: 2,
        };

        expect(eip1559TransactionHasFees(tx as any)).toBe(false);
      });

      it("should return false for 1559 tx with wrong fees", () => {
        const tx: Partial<EvmTransactionLegacy | EvmTransactionEIP1559> = {
          type: 2,
          gasPrice: new BigNumber(100),
        };

        expect(eip1559TransactionHasFees(tx as any)).toBe(false);
      });
    });

    describe("getEstimatedFees", () => {
      it("should return the right fee estimation for a legacy tx", () => {
        const tx = {
          type: 0,
          gasLimit: new BigNumber(3),
          gasPrice: new BigNumber(23),
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(40),
        };

        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(69));
      });

      it("should return the right fee estimation for a 1559 tx", () => {
        const tx = {
          type: 2,
          gasLimit: new BigNumber(42),
          gasPrice: new BigNumber(23),
          maxFeePerGas: new BigNumber(10),
          maxPriorityFeePerGas: new BigNumber(40),
        };

        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(420));
      });
    });
  });
});
