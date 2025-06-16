import { getMemoTagValueByTransactionFamily } from "../utils";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Transaction as StellarTransaction } from "@ledgerhq/live-common/families/stellar/types";
import { Transaction as SolanaTransaction } from "@ledgerhq/live-common/families/solana/types";

describe("getMemoTagValueByTransactionFamily", () => {
  it("should return empty string if transaction family is not recognized", () => {
    const transaction: Transaction = { family: "unknown" } as Transaction;
    expect(getMemoTagValueByTransactionFamily(transaction)).toBeUndefined();
  });

  it("should return tag for xrp family", () => {
    const transaction: Transaction = { family: "xrp", tag: 12345 } as Transaction;
    expect(getMemoTagValueByTransactionFamily(transaction)).toBe(12345);
  });

  it("should return comment text for ton family", () => {
    const transaction: Transaction = {
      family: "ton",
      comment: { text: "Test comment" },
    } as Transaction;
    expect(getMemoTagValueByTransactionFamily(transaction)).toBe("Test comment");
  });

  it("should return memoValue for stellar family", () => {
    const transaction: StellarTransaction = {
      family: "stellar",
      memoValue: "Stellar memo",
    } as StellarTransaction;
    expect(getMemoTagValueByTransactionFamily(transaction)).toBe("Stellar memo");
  });

  it("should return memo for solana family", () => {
    const transaction: SolanaTransaction = {
      family: "solana",
      model: { uiState: { memo: "Solana memo" } },
    } as SolanaTransaction;
    expect(getMemoTagValueByTransactionFamily(transaction)).toBe("Solana memo");
  });

  it("should return memo for default case", () => {
    const transaction: Transaction = { family: "cosmos", memo: "Default memo" } as Transaction & {
      memo: string;
    };
    expect(getMemoTagValueByTransactionFamily(transaction)).toBe("Default memo");
  });
});
