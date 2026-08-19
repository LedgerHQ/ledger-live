import { parseLargeMoverLedgerIds } from "./parseLargeMoverLedgerIds";

describe("parseLargeMoverLedgerIds", () => {
  it("should return ledger ids when they are already comma-separated and lowercase", () => {
    expect(parseLargeMoverLedgerIds("bitcoin,ethereum")).toEqual(["bitcoin", "ethereum"]);
  });

  it("trims, lowercases and dedupes ledger ids", () => {
    expect(parseLargeMoverLedgerIds(" Bitcoin, ethereum ,bitcoin ")).toEqual([
      "bitcoin",
      "ethereum",
    ]);
  });

  it("filters out empty segments", () => {
    expect(parseLargeMoverLedgerIds("btc,,eth")).toEqual(["btc", "eth"]);
  });
});
