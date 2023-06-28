import BigNumber from "bignumber.js";
import { updateTransaction } from "../bridge/js";
import type { Transaction } from "../types";

describe("EVM Family", () => {
  describe("bridge.ts", () => {
    describe("updateTransaction", () => {
      it("should not update the transaction object", () => {
        const transaction: Transaction = {
          family: "evm",
          mode: "send",
          recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
          amount: new BigNumber("10000000000000"),
          gasPrice: new BigNumber("100000000"),
          gasLimit: new BigNumber("21000"),
          chainId: 1,
          nonce: 0,
        };

        const updatedTransaction = updateTransaction(transaction, {
          recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
          amount: new BigNumber("10000000000000"),
          gasPrice: new BigNumber("100000000"),
          gasLimit: new BigNumber("21000"),
        });

        expect(Object.is(transaction, updatedTransaction)).toBe(true);
      });

      it("should update the transaction object", () => {
        const transaction: Transaction = {
          family: "evm",
          mode: "send",
          recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
          amount: new BigNumber("10000000000000"),
          gasPrice: new BigNumber("100000000"),
          gasLimit: new BigNumber("21000"),
          chainId: 1,
          nonce: 0,
        };

        const updatedTransaction = updateTransaction(transaction, {
          recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
          amount: new BigNumber("20000000000000"),
          gasPrice: new BigNumber("100000000"),
          gasLimit: new BigNumber("21000"),
        });

        expect(Object.is(transaction, updatedTransaction)).toBe(false);

        expect(updatedTransaction).toEqual({
          ...transaction,
          amount: new BigNumber("20000000000000"),
        });
      });
    });
  });
});
