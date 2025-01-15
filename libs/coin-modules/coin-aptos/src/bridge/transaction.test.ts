import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";
import { Transaction, TransactionRaw } from "../types";

jest.mock("./logic", () => ({
  DEFAULT_GAS: 100,
  DEFAULT_GAS_PRICE: 200,
}));

describe("transaction Test", () => {
  describe("when formatTransaction", () => {
    describe("when amount is 0 and fee is 0", () => {
      it("should return a transaction SEND to 0xff00 with fees=?", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();

        transaction.recipient = "0xff00";
        const result = formatTransaction(transaction, account);

        const expected = `
SEND 
TO 0xff00
with fees=?`;

        expect(result).toBe(expected);
      });
    });

    describe("when amount is 0 and fee is 0.0001", () => {
      it("should return a transaction SEND to 0xff00 with fees=0", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();

        transaction.recipient = "0xff00";
        transaction.fees = new BigNumber("0.0001");
        const result = formatTransaction(transaction, account);

        const expected = `
SEND 
TO 0xff00
with fees=0`;

        expect(result).toBe(expected);
      });
    });

    describe("when amount is 0 and fee is 0.1", () => {
      it("should return a transaction SEND to 0xff00 with fees=0", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();

        transaction.recipient = "0xff00";
        transaction.fees = new BigNumber("0.1");
        const result = formatTransaction(transaction, account);

        const expected = `
SEND 
TO 0xff00
with fees=0`;

        expect(result).toBe(expected);
      });
    });

    describe("when amount is 1 and fee is 0.1", () => {
      it("should return a transaction SEND to 0xff00 with fees=0", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();

        transaction.amount = new BigNumber("1");
        transaction.recipient = "0xff00";
        transaction.fees = new BigNumber("0.1");
        const result = formatTransaction(transaction, account);

        const expected = `
SEND  0
TO 0xff00
with fees=0`;

        expect(result).toBe(expected);
      });
    });

    describe("when amount is 10 and fee is 1", () => {
      it("should return a transaction SEND to 0xff00 with fees=0", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();

        transaction.amount = new BigNumber("10");
        transaction.recipient = "0xff00";
        transaction.fees = new BigNumber("1");
        const result = formatTransaction(transaction, account);

        const expected = `
SEND  0
TO 0xff00
with fees=0`;

        expect(result).toBe(expected);
      });
    });

    describe("when amount is 1000 and fee is 1", () => {
      it("should return a transaction SEND to 0xff00 with fees=0", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();

        transaction.amount = new BigNumber("1000");
        transaction.recipient = "0xff00";
        transaction.fees = new BigNumber("1");
        const result = formatTransaction(transaction, account);

        const expected = `
SEND  0
TO 0xff00
with fees=0`;

        expect(result).toBe(expected);
      });
    });

    describe("when using MAX with amount is 1000 and fee is 1", () => {
      it("should return a transaction SEND to 0xff00 with fees=0", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();

        transaction.amount = new BigNumber("1000");
        transaction.useAllAmount = true;
        transaction.recipient = "0xff00";
        transaction.fees = new BigNumber("1");
        const result = formatTransaction(transaction, account);

        const expected = `
SEND MAX
TO 0xff00
with fees=0`;

        expect(result).toBe(expected);
      });
    });
  });

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
