import { applyMemoToTransaction } from "./memo";

describe("applyMemoToTransaction", () => {
  describe("empty value is treated as cleared (no memo/tag)", () => {
    it("xrp: empty string clears the tag instead of applying 0", () => {
      expect(applyMemoToTransaction("xrp", "")).toEqual({ tag: undefined });
    });

    it("casper: empty string clears the transferId", () => {
      expect(applyMemoToTransaction("casper", "")).toEqual({ transferId: undefined });
    });

    it("solana: empty string clears the memo", () => {
      expect(applyMemoToTransaction("solana", "")).toEqual({
        model: { uiState: { memo: undefined } },
      });
    });

    it("unknown family: empty string clears the generic memo", () => {
      expect(applyMemoToTransaction("algorand", "")).toEqual({ memo: undefined });
    });
  });

  describe("non-empty values are applied per family", () => {
    it("xrp: numeric tag", () => {
      expect(applyMemoToTransaction("xrp", "123")).toEqual({ tag: 123 });
    });

    it("casper: transferId", () => {
      expect(applyMemoToTransaction("casper", "42")).toEqual({ transferId: "42" });
    });

    it("stellar: forwards value and type", () => {
      expect(applyMemoToTransaction("stellar", "hello", "MEMO_TEXT")).toEqual({
        memoValue: "hello",
        memoType: "MEMO_TEXT",
      });
    });

    it("unknown family: generic memo", () => {
      expect(applyMemoToTransaction("algorand", "note")).toEqual({ memo: "note" });
    });
  });
});
