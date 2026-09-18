import { BigNumber } from "bignumber.js";
import nearMockBridge from "./mock";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "../types";

const { accountBridge } = nearMockBridge;

const DEFAULT_FEE = new BigNumber("1000000000000000000000");

const makeAccount = (spendableBalance: string): Account =>
  ({
    type: "Account",
    spendableBalance: new BigNumber(spendableBalance),
    currency: { name: "NEAR" },
  }) as unknown as Account;

const tx = (overrides: Partial<Transaction> = {}): Transaction => ({
  ...accountBridge.createTransaction({} as Account),
  ...overrides,
});

describe("near mock bridge", () => {
  describe("createTransaction", () => {
    it("returns a zero-amount send transaction carrying the default fee", () => {
      const created = accountBridge.createTransaction({} as Account);

      expect(created.family).toBe("near");
      expect(created.mode).toBe("send");
      expect(created.recipient).toBe("");
      expect(created.useAllAmount).toBe(false);
      expect(created.amount.toFixed()).toBe("0");
      expect(created.fees?.toFixed()).toBe(DEFAULT_FEE.toFixed());
    });
  });

  describe("getTransactionStatus", () => {
    const account = makeAccount("10000000000000000000000000");

    it("requires a recipient", async () => {
      const status = await accountBridge.getTransactionStatus(account, tx());

      expect(status.errors.recipient?.name).toBe("RecipientRequired");
    });

    it("rejects a malformed recipient", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        tx({ recipient: "NOT VALID!", amount: new BigNumber(1) }),
      );

      expect(status.errors.recipient?.name).toBe("InvalidAddress");
    });

    it("requires a non-zero amount", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        tx({ recipient: "alice.near" }),
      );

      expect(status.errors.amount?.name).toBe("AmountRequired");
    });

    it("reports NotEnoughBalance when amount plus fees exceeds the spendable balance", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        tx({ recipient: "alice.near", amount: new BigNumber("10000000000000000000000000") }),
      );

      expect(status.errors.amount?.name).toBe("NotEnoughBalance");
    });

    it("accepts a valid transfer and totals amount plus fees", async () => {
      const amount = new BigNumber("1000000000000000000000000");
      const status = await accountBridge.getTransactionStatus(
        account,
        tx({ recipient: "alice.near", amount }),
      );

      expect(status.errors).toEqual({});
      expect(status.amount.toFixed()).toBe(amount.toFixed());
      expect(status.totalSpent.toFixed()).toBe(amount.plus(DEFAULT_FEE).toFixed());
      expect(status.estimatedFees.toFixed()).toBe(DEFAULT_FEE.toFixed());
    });

    it("spends the whole spendable balance minus fees when useAllAmount is set", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        tx({ recipient: "alice.near", useAllAmount: true }),
      );

      expect(status.errors).toEqual({});
      expect(status.totalSpent.toFixed()).toBe(account.spendableBalance.toFixed());
      expect(status.amount.toFixed()).toBe(account.spendableBalance.minus(DEFAULT_FEE).toFixed());
    });

    it("reports NotEnoughBalance when useAllAmount cannot even cover the fee", async () => {
      const status = await accountBridge.getTransactionStatus(
        makeAccount("1"),
        tx({ recipient: "alice.near", useAllAmount: true }),
      );

      expect(status.errors.amount?.name).toBe("NotEnoughBalance");
    });
  });

  describe("prepareTransaction", () => {
    it("fills the amount from the spendable balance when useAllAmount is set", async () => {
      const account = makeAccount("5000000000000000000000000");

      const prepared = await accountBridge.prepareTransaction(
        account,
        tx({ recipient: "alice.near", useAllAmount: true }),
      );

      expect(prepared.amount.toFixed()).toBe(account.spendableBalance.minus(DEFAULT_FEE).toFixed());
    });

    it("leaves a fixed-amount transaction untouched", async () => {
      const transaction = tx({ recipient: "alice.near", amount: new BigNumber(42) });

      const prepared = await accountBridge.prepareTransaction(makeAccount("1000"), transaction);

      expect(prepared).toBe(transaction);
    });
  });

  describe("estimateMaxSpendable", () => {
    it("subtracts the fee from the spendable balance", async () => {
      const account = makeAccount("5000000000000000000000000");

      const max = await accountBridge.estimateMaxSpendable({ account });

      expect(max.toFixed()).toBe(account.spendableBalance.minus(DEFAULT_FEE).toFixed());
    });

    it("never goes below zero", async () => {
      const max = await accountBridge.estimateMaxSpendable({ account: makeAccount("1") });

      expect(max.toFixed()).toBe("0");
    });
  });
});
