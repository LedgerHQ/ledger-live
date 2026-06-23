import {
  isAvailableOnBuy,
  isAvailableOnSwap,
  ledgerIdsFromLedgerCurrency,
} from "../tradeAvailability";

describe("tradeAvailability", () => {
  describe("isAvailableOnBuy", () => {
    it("returns false when the currency is nullish", () => {
      expect(isAvailableOnBuy(undefined, () => true)).toBe(false);
    });

    it("returns true when any ledger id is available on ramp", () => {
      expect(
        isAvailableOnBuy({ ledgerIds: ["bitcoin", "ethereum"] }, id => id === "ethereum"),
      ).toBe(true);
    });

    it("returns false when no ledger id is available on ramp", () => {
      expect(isAvailableOnBuy({ ledgerIds: ["bitcoin"] }, () => false)).toBe(false);
    });
  });

  describe("isAvailableOnSwap", () => {
    it("returns false when the currency is nullish", () => {
      expect(isAvailableOnSwap(undefined, new Set(["bitcoin"]))).toBe(false);
    });

    it("returns true when any ledger id is in the swap set", () => {
      expect(isAvailableOnSwap({ ledgerIds: ["bitcoin", "solana"] }, new Set(["solana"]))).toBe(
        true,
      );
    });

    it("returns false when no ledger id is in the swap set", () => {
      expect(isAvailableOnSwap({ ledgerIds: ["bitcoin"] }, new Set(["solana"]))).toBe(false);
    });
  });

  describe("ledgerIdsFromLedgerCurrency", () => {
    it("returns the currency id for a coin", () => {
      expect(
        ledgerIdsFromLedgerCurrency({ type: "CryptoCurrency", id: "bitcoin" } as never),
      ).toEqual(["bitcoin"]);
    });

    it("includes the parent currency id for a token", () => {
      expect(
        ledgerIdsFromLedgerCurrency({
          type: "TokenCurrency",
          id: "ethereum/erc20/usd__coin",
          parentCurrencyId: "ethereum",
        } as never),
      ).toEqual(["ethereum/erc20/usd__coin", "ethereum"]);
    });
  });
});
