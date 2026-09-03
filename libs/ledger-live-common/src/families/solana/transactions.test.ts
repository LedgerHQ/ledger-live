import BigNumber from "bignumber.js";
import {
  createStakeAccountTransaction,
  delegateTransaction,
  getTransactionMemo,
  getTransactionStakeAccount,
  getTransactionValidator,
  isTokenTransferTransaction,
  setTransactionMemo,
  undelegateTransaction,
  withdrawTransaction,
} from "./transactions";
import type { Transaction } from "./types";

const asTransaction = (patch: object) => patch as Transaction;

describe("solana transactions", () => {
  describe("getTransactionMemo", () => {
    it("returns the memo the user typed", () => {
      expect(getTransactionMemo(asTransaction(setTransactionMemo("hello")))).toBe("hello");
    });

    // Delegating reuses the memo to carry the stake account; that is plumbing, not a user memo.
    it("ignores the stake account a delegation carries as a memo", () => {
      expect(getTransactionMemo(asTransaction(delegateTransaction("stake-acc", "vote-acc")))).toBe(
        "",
      );
    });

    it("returns an empty string when there is no memo", () => {
      expect(getTransactionMemo(asTransaction({ mode: "send" }))).toBe("");
    });
  });

  describe("staking builders", () => {
    it("puts the validator in the recipient when creating a stake account", () => {
      const tx = createStakeAccountTransaction("vote-acc", new BigNumber(1));

      expect(getTransactionValidator(asTransaction(tx))).toBe("vote-acc");
      expect(getTransactionStakeAccount(asTransaction(tx))).toBeUndefined();
    });

    it("carries the stake account as a memo and the validator as the recipient", () => {
      const tx = delegateTransaction("stake-acc", "vote-acc");

      expect(getTransactionStakeAccount(asTransaction(tx))).toBe("stake-acc");
      expect(getTransactionValidator(asTransaction(tx))).toBe("vote-acc");
    });

    it.each([
      ["undelegate", undelegateTransaction("stake-acc")],
      ["unstake", withdrawTransaction("stake-acc", new BigNumber(1))],
    ])("puts the stake account in the recipient when %s", (_mode, tx) => {
      expect(getTransactionStakeAccount(asTransaction(tx))).toBe("stake-acc");
      expect(getTransactionValidator(asTransaction(tx))).toBeUndefined();
    });
  });

  it("only calls a transfer a token transfer when it targets a sub-account", () => {
    expect(isTokenTransferTransaction(asTransaction({ mode: "send" }))).toBe(false);
    expect(isTokenTransferTransaction(asTransaction({ mode: "send", subAccountId: "sub" }))).toBe(
      true,
    );
    expect(
      isTokenTransferTransaction(asTransaction(delegateTransaction("stake-acc", "vote-acc"))),
    ).toBe(false);
  });
});
