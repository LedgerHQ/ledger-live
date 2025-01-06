import BigNumber from "bignumber.js";
import { fromTransactionRaw, toTransactionRaw } from "./transaction";
import { Transaction, TransactionRaw } from "./types";

jest.mock("./logic", () => ({
  DEFAULT_GAS: 100,
  DEFAULT_GAS_PRICE: 200,
}));

describe("transaction Test", () => {
  describe("when fromTransactionRaw", () => {
    it("should return the transaction object", () => {
      const txRaw = {
        family: "aptos",
        mode: "send",
        fees: null,
        options: "{}",
        estimate: "{}",
        firstEmulation: "{}",
        amount: "0.5",
        recipient: "0xff00",
        useAllAmount: false,
        subAccountId: "0xff01",
        recipientDomain: {},
      } as TransactionRaw;

      const result = fromTransactionRaw(txRaw);

      const expected = {
        family: "aptos",
        amount: new BigNumber("0.5"),
        estimate: {},
        firstEmulation: {},
        mode: "send",
        options: {},
        recipient: "0xff00",
        recipientDomain: {},
        subAccountId: "0xff01",
        useAllAmount: false,
      };

      expect(result).toEqual(expected);
    });
  });

  describe("when toTransactionRaw", () => {
    it("should return the raw transaction object", () => {
      const tx = {
        family: "aptos",
        amount: new BigNumber("0.5"),
        estimate: {},
        firstEmulation: {},
        mode: "send",
        options: {},
        recipient: "0xff00",
        recipientDomain: {},
        subAccountId: "0xff01",
        useAllAmount: false,
      } as Transaction;

      const result = toTransactionRaw(tx);

      const expected = {
        family: "aptos",
        mode: "send",
        fees: null,
        options: "{}",
        estimate: "{}",
        firstEmulation: "{}",
        amount: "0.5",
        recipient: "0xff00",
        useAllAmount: false,
        subAccountId: "0xff01",
        recipientDomain: {},
      } as TransactionRaw;

      expect(result).toEqual(expected);
    });
  });
});
