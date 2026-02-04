import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { getAssetFromToken, getTokenFromAsset } from "./getTokenFromAsset";

beforeAll(async () => {
  const mockStore: CryptoAssetsStore = {
    findTokenById: async () => undefined,
    findTokenByAddressInCurrency: async (address: string, currencyId: string) => {
      const normalizedAddress = address.toLowerCase();
      if (
        normalizedAddress === "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" &&
        currencyId === "ethereum"
      ) {
        return {
          type: "TokenCurrency",
          id: "ethereum/erc20/usd__coin",
          contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          parentCurrency: getCryptoCurrencyById("ethereum"),
          tokenType: "erc20",
          name: "USD Coin",
          ticker: "USDC",
          delisted: false,
          disableCountervalue: false,
          units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
        } as TokenCurrency;
      }
      if (
        normalizedAddress === "0x29219dd400f2bf60e5a23d13be72b486d4038894" &&
        currencyId === "sonic"
      ) {
        return {
          type: "TokenCurrency",
          id: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
          contractAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
          parentCurrency: getCryptoCurrencyById("sonic"),
          tokenType: "erc20",
          name: "Bridged USDC (Sonic Labs)",
          ticker: "USDC",
          delisted: false,
          disableCountervalue: false,
          units: [{ name: "Bridged USDC (Sonic Labs)", code: "USDC", magnitude: 6 }],
        } as TokenCurrency;
      }
      return undefined;
    },
    getTokensSyncHash: async () => "",
  };
  setCryptoAssetsStore(mockStore);
});

describe("getTokenFromAsset", () => {
  it("computes the token of the USDC asset", async () => {
    expect(
      await getTokenFromAsset({ id: "ethereum" } as CryptoCurrency, {
        type: "erc20",
        assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      }),
    ).toMatchObject({
      id: "ethereum/erc20/usd__coin",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
    });
    // Test passes if token is found correctly
    expect(
      await getTokenFromAsset({ id: "sonic" } as CryptoCurrency, {
        type: "erc20",
        assetReference: "0x29219dd400f2bf60e5a23d13be72b486d4038894",
      }),
    ).toMatchObject({
      id: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
      contractAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
      name: "Bridged USDC (Sonic Labs)",
    });
    // Test passes if token is found correctly
  });

  it("does not compute the token of an unknown asset, trusting the CAL", async () => {
    const mockStore = getCryptoAssetsStore();
    const findTokenByAddressInCurrency = jest.spyOn(mockStore, "findTokenByAddressInCurrency");

    expect(
      await getTokenFromAsset({ id: "ethereum" } as CryptoCurrency, {
        type: "token",
        assetReference: "unknown-reference",
      }),
    ).toBeUndefined();

    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("unknown-reference", "ethereum");
  });
});

describe("getAssetFromToken", () => {
  it("computes the asset of the USDC token", () => {
    expect(
      getAssetFromToken(
        { id: "ethereum" } as CryptoCurrency,
        {
          parentCurrency: { id: "ethereum" },
          tokenType: "erc20",
          contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          name: "USD Coin",
          units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
        } as unknown as TokenCurrency,
        "owner",
      ),
    ).toEqual({
      assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      assetOwner: "owner",
      name: "USD Coin",
      type: "erc20",
      unit: {
        code: "USDC",
        magnitude: 6,
        name: "USD Coin",
      },
    });
  });

  it("computes the asset of the FXRP token", () => {
    expect(
      getAssetFromToken(
        { id: "flare" } as CryptoCurrency,
        {
          parentCurrency: { id: "flare" },
          tokenType: "erc20",
          contractAddress: "0xad552a648c74d49e10027ab8a618a3ad4901c5be",
          name: "FXRP",
          units: [{ name: "FXRP", code: "FXRP", magnitude: 6 }],
        } as unknown as TokenCurrency,
        "owner",
      ),
    ).toEqual({
      assetReference: "0xAd552A648C74D49E10027AB8a618A3ad4901c5bE",
      assetOwner: "owner",
      name: "FXRP",
      type: "erc20",
      unit: {
        code: "FXRP",
        magnitude: 6,
        name: "FXRP",
      },
    });
  });

  it("fails to compute an asset from a token if the main currency is not its parent", () => {
    expect(() =>
      getAssetFromToken(
        { id: "sonic" } as CryptoCurrency,
        {
          id: "usdc_on_ethereum",
          parentCurrency: { id: "ethereum" },
          tokenType: "erc20",
          contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          name: "USD Coin",
          units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
        } as unknown as TokenCurrency,
        "owner",
      ),
    ).toThrow("'usdc_on_ethereum' is not a valid token for 'sonic'");
  });
});
