import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../../bridge/bridge.fixture";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "../../bridge/transaction";
import { Transaction, TransactionRaw } from "../../types";

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
        transaction.fees = BigNumber("0.0001");
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
        transaction.fees = BigNumber("0.1");
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

        transaction.amount = BigNumber("1");
        transaction.recipient = "0xff00";
        transaction.fees = BigNumber("0.1");
        const result = formatTransaction(transaction, account);

        const expected = `
SEND  0.00000001
TO 0xff00
with fees=0`;

        expect(result).toBe(expected);
      });
    });

    describe("when amount is 10 and fee is 1", () => {
      it("should return a transaction SEND to 0xff00 with fees=0", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();

        transaction.amount = BigNumber("10");
        transaction.recipient = "0xff00";
        transaction.fees = BigNumber("1");
        const result = formatTransaction(transaction, account);

        const expected = `
SEND  0.0000001
TO 0xff00
with fees=0.00000001`;

        expect(result).toBe(expected);
      });
    });

    describe("when amount is 1000 and fee is 1", () => {
      it("should return a transaction SEND to 0xff00 with fees=0", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();

        transaction.amount = BigNumber("1000");
        transaction.recipient = "0xff00";
        transaction.fees = BigNumber("1");
        const result = formatTransaction(transaction, account);

        const expected = `
SEND  0.00001
TO 0xff00
with fees=0.00000001`;

        expect(result).toBe(expected);
      });
    });

    describe("when using MAX with amount is 1000 and fee is 1", () => {
      it("should return a transaction SEND to 0xff00 with fees=0", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();

        transaction.amount = BigNumber("1000");
        transaction.useAllAmount = true;
        transaction.recipient = "0xff00";
        transaction.fees = BigNumber("1");
        const result = formatTransaction(transaction, account);

        const expected = `
SEND MAX
TO 0xff00
with fees=0.00000001`;

        expect(result).toBe(expected);
      });
    });
  });

  describe("when fromTransactionRaw", () => {
    it("should return the transaction object", () => {
      const txRaw = {
        family: "aptos",
        mode: "send",
        options: "{}",
        amount: "0.5",
        recipient: "0xff00",
        useAllAmount: false,
        subAccountId: "0xff01",
        recipientDomain: {},
      } as TransactionRaw;

      const result = fromTransactionRaw(txRaw);

      const expected = {
        family: "aptos",
        amount: BigNumber("0.5"),
        options: {},
        mode: "send",
        recipient: "0xff00",
        recipientDomain: {},
        subAccountId: "0xff01",
        useAllAmount: false,
      };

      expect(result).toEqual(expected);
    });

    it("should return the transaction object with fees and errors", () => {
      const txRaw = {
        family: "aptos",
        mode: "send",
        fees: "50",
        errors: '{ "errors": "error" }',
        options: "{}",
        amount: "0.5",
        recipient: "0xff00",
        useAllAmount: false,
        subAccountId: "0xff01",
        recipientDomain: {},
      } as TransactionRaw;

      const result = fromTransactionRaw(txRaw);

      const expected = {
        family: "aptos",
        amount: BigNumber("0.5"),
        fees: BigNumber(50),
        errors: { errors: "error" },
        options: {},
        mode: "send",
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
        amount: BigNumber("0.5"),
        options: {},
        mode: "send",
        recipient: "0xff00",
        recipientDomain: {},
        subAccountId: "0xff01",
        useAllAmount: false,
      } as Transaction;

      const result = toTransactionRaw(tx);

      const expected = {
        family: "aptos",
        mode: "send",
        options: "{}",
        amount: "0.5",
        recipient: "0xff00",
        useAllAmount: false,
        subAccountId: "0xff01",
        recipientDomain: {},
      } as TransactionRaw;

      expect(result).toEqual(expected);
    });

    it("should return the raw transaction object with fees", () => {
      const tx = {
        family: "aptos",
        amount: BigNumber("0.5"),
        options: {},
        fees: BigNumber("0.1"),
        mode: "send",
        recipient: "0xff00",
        recipientDomain: {},
        subAccountId: "0xff01",
        useAllAmount: false,
      } as Transaction;

      const result = toTransactionRaw(tx);

      const expected = {
        family: "aptos",
        mode: "send",
        fees: "0.1",
        options: "{}",
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
