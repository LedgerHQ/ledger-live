import BigNumber from "bignumber.js";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getBitcoinEstimationRecipient } from "@ledgerhq/coin-bitcoin/constants";
import type { BitcoinAccount, Transaction } from "@ledgerhq/coin-bitcoin/types";
import mockBridge from "./mock";

const { accountBridge } = mockBridge;

const CURRENCY = createFixtureAccount().currency;

const RECIPIENT = "bc1qqmxqdrkxgx6swrvjl9l2e6szvvkg45all5u4fl";

const accountWithBalance = (balance: number): BitcoinAccount => ({
  ...createFixtureAccount(),
  balance: new BigNumber(balance),
});

const transactionTo = (account: BitcoinAccount, patch: Partial<Transaction>): Transaction => ({
  ...accountBridge.createTransaction(account),
  recipient: RECIPIENT,
  ...patch,
});

describe("bitcoin mock bridge", () => {
  describe("createTransaction", () => {
    it("creates an empty transaction with a default fee per byte", () => {
      expect(accountBridge.createTransaction(accountWithBalance(0))).toEqual({
        family: "bitcoin",
        amount: new BigNumber(0),
        recipient: "",
        feePerByte: new BigNumber(10),
        networkInfo: null,
        useAllAmount: false,
        rbf: false,
        utxoStrategy: { strategy: 0, excludeUTXOs: [] },
      });
    });
  });

  describe("transaction lifecycle", () => {
    it("creates equal empty transactions", () => {
      const account = accountWithBalance(0);

      expect(accountBridge.createTransaction(account)).toEqual(
        accountBridge.createTransaction(account),
      );
    });

    it("returns the same transaction when the same patch is applied twice", () => {
      const account = accountWithBalance(0);
      const patch = { amount: new BigNumber(1000), recipient: account.freshAddress };
      const updated = accountBridge.updateTransaction(
        accountBridge.createTransaction(account),
        patch,
      );

      expect(accountBridge.updateTransaction(updated, patch)).toBe(updated);
    });

    it("reports a recipient error and zero amounts for an empty transaction", async () => {
      const account = accountWithBalance(1_000_000);

      const status = await accountBridge.getTransactionStatus(account, {
        ...accountBridge.createTransaction(account),
        feePerByte: new BigNumber(0.0001),
      });

      expect({
        recipientError: status.errors.recipient?.name,
        amount: status.amount,
      }).toEqual({ recipientError: "RecipientRequired", amount: new BigNumber(0) });
    });

    it("exposes the signing and broadcast methods", () => {
      expect([typeof accountBridge.signOperation, typeof accountBridge.broadcast]).toEqual([
        "function",
        "function",
      ]);
    });
  });

  describe("estimateMaxSpendable", () => {
    it("reserves a flat fee when there is no transaction", async () => {
      const account = accountWithBalance(10_000);

      const max = await accountBridge.estimateMaxSpendable({ account });

      expect(max).toEqual(new BigNumber(5_000));
    });

    it("reserves the fee of the transaction", async () => {
      const account = accountWithBalance(10_000);

      const max = await accountBridge.estimateMaxSpendable({
        account,
        transaction: transactionTo(account, { feePerByte: new BigNumber(4) }),
      });

      expect(max).toEqual(new BigNumber(9_000));
    });

    it("never goes below zero", async () => {
      const account = accountWithBalance(100);

      const max = await accountBridge.estimateMaxSpendable({ account });

      expect(max).toEqual(new BigNumber(0));
    });
  });

  describe("getTransactionStatus", () => {
    it("requires a recipient", async () => {
      const account = accountWithBalance(1_000_000);

      const status = await accountBridge.getTransactionStatus(
        account,
        transactionTo(account, { recipient: "", amount: new BigNumber(100_000) }),
      );

      expect(status.errors.recipient?.name).toEqual("RecipientRequired");
    });

    it("rejects an invalid recipient", async () => {
      const account = accountWithBalance(1_000_000);

      const status = await accountBridge.getTransactionStatus(
        account,
        transactionTo(account, { recipient: "invalidADDRESS", amount: new BigNumber(100_000) }),
      );

      expect(status.errors.recipient?.name).toEqual("InvalidAddress");
    });

    it("requires an amount", async () => {
      const account = accountWithBalance(1_000_000);

      const status = await accountBridge.getTransactionStatus(
        account,
        transactionTo(account, { amount: new BigNumber(0) }),
      );

      expect(status.errors.amount?.name).toEqual("AmountRequired");
    });

    it("reports a lack of balance when the amount and the fees exceed the balance", async () => {
      const account = accountWithBalance(100_000);

      const status = await accountBridge.getTransactionStatus(
        account,
        transactionTo(account, { amount: new BigNumber(100_000) }),
      );

      expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
    });

    it("reports a lack of balance when sending the maximum of an account that cannot pay the fees", async () => {
      const account = accountWithBalance(2_000);

      const status = await accountBridge.getTransactionStatus(
        account,
        transactionTo(account, { useAllAmount: true }),
      );

      expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
    });

    it("reports a dust limit for an amount of one satoshi", async () => {
      const account = accountWithBalance(1_000_000);

      const status = await accountBridge.getTransactionStatus(
        account,
        transactionTo(account, { amount: new BigNumber(1) }),
      );

      expect(status.errors.dustLimit?.name).toEqual("DustLimit");
    });

    it("warns that the fees are too high for a small amount", async () => {
      const account = accountWithBalance(1_000_000);

      const status = await accountBridge.getTransactionStatus(
        account,
        transactionTo(account, { amount: new BigNumber(10_000) }),
      );

      expect(status.warnings.feeTooHigh?.name).toEqual("FeeTooHigh");
    });

    it("sends the whole balance minus the fees when sending the maximum", async () => {
      const account = accountWithBalance(1_000_000);

      const status = await accountBridge.getTransactionStatus(
        account,
        transactionTo(account, { useAllAmount: true }),
      );

      expect({
        errors: status.errors,
        amount: status.amount,
        estimatedFees: status.estimatedFees,
        totalSpent: status.totalSpent,
      }).toEqual({
        errors: {},
        amount: new BigNumber(997_500),
        estimatedFees: new BigNumber(2_500),
        totalSpent: new BigNumber(1_000_000),
      });
    });

    it("accepts a valid send and prices it with a fixed size", async () => {
      const account = accountWithBalance(1_000_000);

      const status = await accountBridge.getTransactionStatus(
        account,
        transactionTo(account, { amount: new BigNumber(500_000) }),
      );

      expect({
        errors: status.errors,
        warnings: status.warnings,
        estimatedFees: status.estimatedFees,
        totalSpent: status.totalSpent,
      }).toEqual({
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber(2_500),
        totalSpent: new BigNumber(502_500),
      });
    });
  });

  describe("prepareTransaction", () => {
    it("loads the network fees when the transaction has none", async () => {
      const account = accountWithBalance(0);

      const prepared = await accountBridge.prepareTransaction(account, transactionTo(account, {}));

      expect(prepared.networkInfo).toEqual({
        family: "bitcoin",
        feeItems: {
          items: [
            { key: "1", speed: "fast", feePerByte: new BigNumber(4) },
            { key: "3", speed: "medium", feePerByte: new BigNumber(3) },
            { key: "6", speed: "slow", feePerByte: new BigNumber(2) },
          ],
          defaultFeePerByte: new BigNumber(0),
        },
        relayFeePerByte: new BigNumber(1),
      });
    });

    it("applies the fee of the selected fees strategy", async () => {
      const account = accountWithBalance(0);

      const prepared = await accountBridge.prepareTransaction(
        account,
        transactionTo(account, { feesStrategy: "slow" }),
      );

      expect(prepared.feePerByte).toEqual(new BigNumber(2));
    });

    it("keeps the fee of a custom fees strategy", async () => {
      const account = accountWithBalance(0);

      const prepared = await accountBridge.prepareTransaction(
        account,
        transactionTo(account, { feesStrategy: "custom", feePerByte: new BigNumber(7) }),
      );

      expect(prepared.feePerByte).toEqual(new BigNumber(7));
    });

    it("falls back to the default fee when no fee matches the fees strategy", async () => {
      const account = accountWithBalance(0);

      const prepared = await accountBridge.prepareTransaction(
        account,
        transactionTo(account, {
          feesStrategy: "fast",
          feePerByte: new BigNumber(7),
          networkInfo: {
            family: "bitcoin",
            feeItems: { items: [], defaultFeePerByte: new BigNumber(5) },
            relayFeePerByte: new BigNumber(1),
          },
        }),
      );

      expect(prepared.feePerByte).toEqual(new BigNumber(5));
    });

    it("keeps the fee when no fee matches the fees strategy and the default fee is zero", async () => {
      const account = accountWithBalance(0);

      const prepared = await accountBridge.prepareTransaction(
        account,
        transactionTo(account, {
          feesStrategy: "fast",
          feePerByte: new BigNumber(7),
          networkInfo: {
            family: "bitcoin",
            feeItems: { items: [], defaultFeePerByte: new BigNumber(0) },
            relayFeePerByte: new BigNumber(1),
          },
        }),
      );

      expect(prepared.feePerByte).toEqual(new BigNumber(7));
    });

    it("returns the same transaction when nothing has to be prepared", async () => {
      const account = accountWithBalance(0);
      const prepared = await accountBridge.prepareTransaction(account, transactionTo(account, {}));

      const preparedAgain = await accountBridge.prepareTransaction(account, prepared);

      expect(preparedAgain).toBe(prepared);
    });
  });

  describe("getEstimationRecipient", () => {
    it("uses the estimation recipient of the currency", () => {
      const account = accountWithBalance(0);

      expect(accountBridge.getEstimationRecipient?.(account)).toEqual(
        getBitcoinEstimationRecipient("bitcoin"),
      );
    });
  });

  describe("currency bridge", () => {
    it("preloads nothing", async () => {
      const preloaded = await mockBridge.currencyBridge.preload?.(CURRENCY);

      expect(preloaded).toEqual({});
    });
  });
});
