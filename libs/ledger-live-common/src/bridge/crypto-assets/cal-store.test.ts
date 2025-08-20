import { CALStore } from "./cal-store";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

describe("CALStore", () => {
  let store: CALStore;

  beforeEach(() => {
    store = new CALStore();
  });

  describe("Token cache operations", () => {
    const token = {
      id: "ethereum/erc20/usdt",
      name: "Tether USD",
      ticker: "USDT",
      contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      parentCurrency: { id: "ethereum" },
      type: "TokenCurrency",
      units: [
        {
          name: "USDT",
          code: "USDT",
          magnitude: 6,
        },
      ],
    } as TokenCurrency;

    it("should store and retrieve tokens by ID", () => {
      store.addTokens([token]);

      const foundToken = store.findTokenById("ethereum/erc20/usdt");
      expect(foundToken).toEqual(token);
    });

    it("should store and retrieve tokens by address", () => {
      store.addTokens([token]);

      const foundToken = store.findTokenByAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7");
      expect(foundToken).toEqual(token);
    });

    it("should store and retrieve tokens by ticker", () => {
      store.addTokens([token]);

      const foundToken = store.findTokenByTicker("USDT");
      expect(foundToken).toEqual(token);
    });

    it("should find token by address in specific currency", () => {
      store.addTokens([token]);

      const foundToken = store.findTokenByAddressInCurrency(
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "ethereum",
      );
      expect(foundToken).toEqual(token);
    });

    it("should not find token by address in different currency", () => {
      store.addTokens([token]);

      const foundToken = store.findTokenByAddressInCurrency(
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "polygon",
      );
      expect(foundToken).toBeUndefined();
    });

    it("should return undefined for non-existent address in findTokenByAddressInCurrency", () => {
      store.addTokens([token]);

      const foundToken = store.findTokenByAddressInCurrency("0xNONEXISTENT", "ethereum");
      expect(foundToken).toBeUndefined();
    });

    it("should return undefined for non-existent tokens", () => {
      expect(store.findTokenById("non-existent")).toBeUndefined();
      expect(store.findTokenByAddress("0x0000")).toBeUndefined();
      expect(store.findTokenByTicker("FAKE")).toBeUndefined();
    });

    it("should throw error when getting non-existent token by ID", () => {
      expect(() => store.getTokenById("non-existent")).toThrow("Token not found: non-existent");
    });

    it("should get existing token by ID", () => {
      store.addTokens([token]);

      const foundToken = store.getTokenById("ethereum/erc20/usdt");
      expect(foundToken).toEqual(token);
    });
  });
});
