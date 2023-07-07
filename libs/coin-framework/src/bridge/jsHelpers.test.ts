import BigNumber from "bignumber.js";
import { defaultUpdateTransaction } from "./jsHelpers";
import type { TransactionCommon } from "@ledgerhq/types-live";

describe("jsHelpers", () => {
  describe("defaultUpdateTransaction", () => {
    it("should not update the transaction object", () => {
      const transaction: TransactionCommon = {
        recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
        amount: new BigNumber("10000000000000"),
      };

      const updatedTransaction = defaultUpdateTransaction(transaction, {
        recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
        amount: new BigNumber("10000000000000"),
      });

      expect(Object.is(transaction, updatedTransaction)).toBe(true);
    });

    it("should update the transaction object", () => {
      const transaction: TransactionCommon = {
        recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
        amount: new BigNumber("10000000000000"),
      };

      const updatedTransaction = defaultUpdateTransaction(transaction, {
        recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
        amount: new BigNumber("20000000000000"),
      });

      expect(Object.is(transaction, updatedTransaction)).toBe(false);

      expect(updatedTransaction).toEqual({
        ...transaction,
        amount: new BigNumber("20000000000000"),
      });
    });
  });
});
