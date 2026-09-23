import type { Account } from "@ledgerhq/types-live";
import { intentToMessageParams } from "@ledgerhq/coin-cosmos/logic/transaction/intentAdapter";
import { transactionToIntent } from "../../generic-coin-framework/utils";
import type { GenericTransaction } from "../../generic-coin-framework/types";
import { applyMemoToTransaction, buildRecipientTransactionPatch, cosmosMemoPatch } from "./memo";

describe("applyMemoToTransaction", () => {
  describe("empty value is treated as cleared (no memo/tag)", () => {
    it("xrp: empty string clears the tag instead of applying 0", () => {
      expect(applyMemoToTransaction("xrp", "")).toEqual({ tag: undefined });
    });

    it("casper: empty string clears the memo", () => {
      expect(applyMemoToTransaction("casper", "")).toEqual({
        transferId: undefined,
        memoType: "transferId",
        memoValue: undefined,
      });
    });

    it("solana: empty string clears the memo", () => {
      expect(applyMemoToTransaction("solana", "")).toEqual({
        model: { uiState: { memo: undefined } },
      });
    });

    it("cosmos: empty string clears memo/memoType/memoValue", () => {
      expect(applyMemoToTransaction("cosmos", "")).toEqual({
        memo: undefined,
        memoType: null,
        memoValue: undefined,
      });
    });

    it("unknown family: empty string clears the generic memo", () => {
      expect(applyMemoToTransaction("algorand", "")).toEqual({ memo: undefined });
    });

    it("ton: empty string keeps the comment text an empty string, not undefined", () => {
      expect(
        applyMemoToTransaction("ton", "", undefined, { comment: { isEncrypted: false, text: "" } }),
      ).toEqual({ comment: { isEncrypted: false, text: "" } });
    });
  });

  describe("non-empty values are applied per family", () => {
    it("xrp: numeric tag", () => {
      expect(applyMemoToTransaction("xrp", "123")).toEqual({ tag: 123 });
    });

    it("casper: sets transferId/memoType/memoValue", () => {
      expect(applyMemoToTransaction("casper", "42")).toEqual({
        transferId: "42",
        memoType: "transferId",
        memoValue: "42",
      });
    });

    it("stellar: forwards value and type", () => {
      expect(applyMemoToTransaction("stellar", "hello", "MEMO_TEXT")).toEqual({
        memoValue: "hello",
        memoType: "MEMO_TEXT",
      });
    });

    it("cosmos: sets memo/memoType/memoValue, ignoring any incoming type (no type selector exists)", () => {
      expect(applyMemoToTransaction("cosmos", "hello")).toEqual({
        memo: "hello",
        memoType: "text",
        memoValue: "hello",
      });
    });

    it("unknown family: generic memo", () => {
      expect(applyMemoToTransaction("algorand", "note")).toEqual({ memo: "note" });
    });
  });
});

describe("buildRecipientTransactionPatch", () => {
  it("applies a generic recipient address", () => {
    expect(
      buildRecipientTransactionPatch({ family: "cosmos" }, { address: "cosmos1abc123" }),
    ).toEqual({
      recipient: "cosmos1abc123",
    });
  });

  it("applies memo through the family memo registry", () => {
    expect(
      buildRecipientTransactionPatch(
        { family: "solana", model: { kind: "transfer", uiState: {} } },
        { address: "solana-address", memo: { value: "solana memo" } },
      ),
    ).toEqual({
      recipient: "solana-address",
      model: {
        kind: "transfer",
        uiState: { memo: "solana memo" },
      },
    });
  });

  it("keeps ton comment text a string when the memo is left untouched", () => {
    expect(
      buildRecipientTransactionPatch(
        { family: "ton", comment: { isEncrypted: false, text: "" } },
        { address: "ton-address", memo: { value: "", type: undefined } },
      ),
    ).toEqual({
      recipient: "ton-address",
      comment: { isEncrypted: false, text: "" },
    });
  });

  it("applies a valid destination tag through the memo registry", () => {
    expect(
      buildRecipientTransactionPatch(
        { family: "xrp" },
        { address: "xrp-address", destinationTag: "12345" },
      ),
    ).toEqual({
      recipient: "xrp-address",
      tag: 12345,
    });
  });

  it("clears an empty destination tag through the memo registry", () => {
    expect(
      buildRecipientTransactionPatch(
        { family: "xrp" },
        { address: "xrp-address", destinationTag: "" },
      ),
    ).toEqual({
      recipient: "xrp-address",
      tag: undefined,
    });
  });

  it("clears a whitespace-only destination tag through the memo registry", () => {
    expect(
      buildRecipientTransactionPatch(
        { family: "xrp" },
        { address: "xrp-address", destinationTag: "   " },
      ),
    ).toEqual({
      recipient: "xrp-address",
      tag: undefined,
    });
  });

  it("ignores invalid destination tags", () => {
    expect(
      buildRecipientTransactionPatch(
        { family: "xrp" },
        { address: "xrp-address", destinationTag: "invalid" },
      ),
    ).toEqual({
      recipient: "xrp-address",
    });
  });
});

describe("Cosmos memo survives shared intent construction end to end", () => {
  const account = { currency: { name: "cosmos", units: [{}] } } as Account;

  it("carries a memo from a UI write-site patch through to the crafted message params", () => {
    const transaction = {
      family: "cosmos",
      ...cosmosMemoPatch("pay invoice 42"),
    } as unknown as GenericTransaction;

    const intent = transactionToIntent(account, transaction);
    expect(intent.memo).toEqual({ type: "string", kind: "text", value: "pay invoice 42" });

    const params = intentToMessageParams(intent, "cosmos", "uatom");
    expect(params.memo).toBe("pay invoice 42");
  });

  it("resolves to no memo, not an empty-string memo, when the field is cleared", () => {
    const transaction = {
      family: "cosmos",
      ...cosmosMemoPatch(undefined),
    } as unknown as GenericTransaction;

    const intent = transactionToIntent(account, transaction);
    expect(intent.memo).toEqual({ type: "none" });

    const params = intentToMessageParams(intent, "cosmos", "uatom");
    expect(params.memo).toBe("");
  });
});
