import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { TonCommentInvalid, TonExcessFee, TonMinimumRequired } from "../../errors";
import getTransactionStatus from "../../getTransactionStatus";
import {
  account,
  transaction as baseTransaction,
  jettonTransaction,
} from "../fixtures/common.fixtures";

describe("getTransactionStatus", () => {
  describe("Recipient", () => {
    it("should detect the missing recipient and have an error", async () => {
      const transaction = { ...baseTransaction, recipient: "" };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          recipient: new RecipientRequired(),
        }),
      );
    });

    it("should detect the incorrect recipient and have an error", async () => {
      const transaction = { ...baseTransaction, recipient: "isInvalid" };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          recipient: new InvalidAddress("", {
            currencyName: account.currency.name,
          }),
        }),
      );
    });

    it("should detect the recipient and the sender are the same and have an error", async () => {
      const transaction = {
        ...baseTransaction,
        recipient: "UQDzd8aeBOU-jqYw_ZSuZjceI5p-F4b7HMprAsUJAtRPbMol",
      };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          recipient: new InvalidAddressBecauseDestinationIsAlsoSource("", {
            currencyName: account.currency.name,
          }),
        }),
      );
    });
  });

  describe("Sender", () => {
    it("should detect the sender is not correct and have an error", async () => {
      const tempAccount = { ...account, freshAddress: "isInvalid" };
      const res = await getTransactionStatus(tempAccount, baseTransaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          sender: new InvalidAddress(),
        }),
      );
    });
  });

  describe("Amount", () => {
    it("should detect the amount is missing and have an error", async () => {
      const transaction = { ...baseTransaction, amount: new BigNumber(0) };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new AmountRequired(),
        }),
      );
    });

    it("should detect the amount is greater than the spendable amount and have an error", async () => {
      const transaction = {
        ...baseTransaction,
        amount: BigNumber(1000000002),
        fees: new BigNumber("20"),
      };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new NotEnoughBalance(),
        }),
      );
    });

    it("should return NotEnoughBalance (not TonMinimumRequired) when balance is below 0.02 and amount exceeds balance", async () => {
      const lowBalanceAccount = { ...account, balance: new BigNumber("10000000") };
      const transaction = {
        ...baseTransaction,
        amount: new BigNumber("200000000"),
        fees: new BigNumber("1000"),
      };
      const res = await getTransactionStatus(lowBalanceAccount, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new NotEnoughBalance(),
        }),
      );
    });

    it("should return TonMinimumRequired when balance is below 0.02 and the amount is otherwise affordable", async () => {
      const lowBalanceAccount = { ...account, balance: new BigNumber("15000000") };
      const transaction = {
        ...baseTransaction,
        amount: new BigNumber("1000000"),
        fees: new BigNumber("1000"),
      };
      const res = await getTransactionStatus(lowBalanceAccount, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new TonMinimumRequired(),
        }),
      );
    });

    it("should return AmountRequired (not TonMinimumRequired) when amount is zero and balance is below 0.02", async () => {
      const lowBalanceAccount = { ...account, balance: new BigNumber("10000000") };
      const transaction = { ...baseTransaction, amount: new BigNumber(0) };
      const res = await getTransactionStatus(lowBalanceAccount, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new AmountRequired(),
        }),
      );
    });

    it("should not trigger TonMinimumRequired when balance is exactly 0.02 TON", async () => {
      const boundaryAccount = { ...account, balance: new BigNumber("20000000") };
      const transaction = {
        ...baseTransaction,
        amount: new BigNumber("1000000"),
        fees: new BigNumber("1000"),
      };
      const res = await getTransactionStatus(boundaryAccount, transaction);
      expect(res.errors.amount).toBeUndefined();
    });

    it("should detect the amount is greater than the spendable amount of the token account and have an error", async () => {
      const transaction = {
        ...jettonTransaction,
        amount: BigNumber(1000000002),
        fees: new BigNumber("20"),
      };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new NotEnoughBalance(),
        }),
      );
    });

    it("should detect the transaction is a jetton transfer and have a warning", async () => {
      const transaction = {
        ...jettonTransaction,
        amount: BigNumber(1000000002),
        fees: new BigNumber("20"),
      };
      const res = await getTransactionStatus(account, transaction);
      expect(res.warnings).toEqual(
        expect.objectContaining({
          amount: new TonExcessFee(),
        }),
      );
    });

    describe("Comment", () => {
      it("should detect the comment is not valid and have an error", async () => {
        const transaction = {
          ...baseTransaction,
          amount: new BigNumber("1"),
          comment: { isEncrypted: false, text: "comment\nInvalid" },
        };
        const res = await getTransactionStatus(account, transaction);
        expect(res.errors).toEqual(
          expect.objectContaining({
            transaction: new TonCommentInvalid(),
          }),
        );
      });

      it("should report a malformed comment as an error instead of throwing", async () => {
        const transaction = {
          ...baseTransaction,
          amount: new BigNumber("1"),
          comment: { isEncrypted: false, text: undefined as unknown as string },
        };
        const res = await getTransactionStatus(account, transaction);
        expect(res.errors).toEqual(
          expect.objectContaining({
            transaction: new TonCommentInvalid(),
          }),
        );
      });
    });

    describe("Successful transaction", () => {
      it("should not have errors", async () => {
        const successfulResult = {
          amount: baseTransaction.amount,
          errors: {},
          warnings: {},
          estimatedFees: baseTransaction.fees,
          totalSpent: baseTransaction.amount.plus(baseTransaction.fees),
        };
        const res = await getTransactionStatus(account, baseTransaction);
        expect(res).toEqual(successfulResult);
      });
    });
  });
});
