/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { computeIntentType, getAssetFromToken, getTokenFromAsset } from "./api";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");

const mockToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "celo/erc20/celo_dollar",
  tokenType: "erc20",
  contractAddress: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  name: "Celo Dollar",
  ticker: "cUSD",
  parentCurrencyId: "celo",
  units: [{ name: "cUSD", code: "cUSD", magnitude: 18 }],
};

const celo = getCryptoCurrencyById("celo");

describe("celo bridge", () => {
  describe("computeIntentType", () => {
    it.each([
      [{ mode: "send" }, "send"],
      [{}, "send"],
      [{ mode: undefined }, "send"],
      [{ mode: "register" }, "celo.register"],
      [{ mode: "lock" }, "celo.lock"],
      [{ mode: "unlock" }, "celo.unlock"],
      [{ mode: "withdraw" }, "celo.withdraw"],
      [{ mode: "vote" }, "celo.vote"],
      [{ mode: "activate" }, "celo.activate"],
      [{ mode: "revoke", index: 0 }, "celo.revokePending"],
      [{ mode: "revoke", index: 1 }, "celo.revokeActive"],
      [{ mode: "revoke" }, "celo.revokeActive"],
    ])("maps %o to %s", (transaction, expected) => {
      expect(computeIntentType(transaction)).toBe(expected);
    });

    it("throws for an unsupported mode", () => {
      expect(() => computeIntentType({ mode: "swap" })).toThrow(
        "Unsupported Celo transaction mode: swap",
      );
    });
  });

  describe("getTokenFromAsset", () => {
    const mockFindTokenByAddressInCurrency = jest.fn() as jest.MockedFunction<
      CryptoAssetsStore["findTokenByAddressInCurrency"]
    >;

    (
      jest.requireMock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore") as {
        getCryptoAssetsStore: jest.Mock;
      }
    ).getCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
    });

    afterEach(() => jest.clearAllMocks());

    it("returns undefined for a native asset", async () => {
      const result = await getTokenFromAsset(celo, { type: "native" });
      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("returns undefined when the asset has no assetReference", async () => {
      const result = await getTokenFromAsset(celo, { type: "erc20" } as AssetInfo);
      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("looks the token up by address in the celo currency", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);
      const asset: AssetInfo = { type: "erc20", assetReference: mockToken.contractAddress };

      const result = await getTokenFromAsset(celo, asset);

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
        mockToken.contractAddress,
        celo.id,
      );
      expect(result).toBe(mockToken);
    });

    it("returns undefined when the token is not recognized", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(undefined);
      const asset: AssetInfo = { type: "erc20", assetReference: "0xUnknown" };
      expect(await getTokenFromAsset(celo, asset)).toBeUndefined();
    });
  });

  describe("getAssetFromToken", () => {
    const owner = "0x7777777777777777777777777777777777777777";

    it("maps a token to AssetInfo", () => {
      expect(getAssetFromToken(mockToken, owner)).toEqual({
        type: "erc20",
        assetReference: mockToken.contractAddress,
        assetOwner: owner,
        name: "Celo Dollar",
        unit: mockToken.units[0],
      });
    });
  });
});
