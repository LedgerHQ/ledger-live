import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getCryptoAssetsStore, setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAssetFromToken, getTokenFromAsset } from "./bridge";

beforeAll(() => {
  const ethereum = getCryptoCurrencyById("ethereum");
  const sonic = getCryptoCurrencyById("sonic");

  const mockStore: Parameters<typeof setCryptoAssetsStore>[0] = {
    findTokenById: async () => undefined,
    findTokenByAddressInCurrency: async (address: string, currencyId: string) => {
      const normalizedAddress = address.toLowerCase();

      if (
        normalizedAddress === "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" &&
        currencyId === "ethereum"
      ) {
        const usdc: TokenCurrency = {
          type: "TokenCurrency",
          id: "ethereum/erc20/usd__coin",
          contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          parentCurrency: ethereum,
          tokenType: "erc20",
          name: "USD Coin",
          ticker: "USDC",
          delisted: false,
          disableCountervalue: false,
          units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
        };
        return usdc;
      }

      if (
        normalizedAddress === "0x29219dd400f2bf60e5a23d13be72b486d4038894" &&
        currencyId === "sonic"
      ) {
        const bridgedUsdc: TokenCurrency = {
          type: "TokenCurrency",
          id: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
          contractAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
          parentCurrency: sonic,
          tokenType: "erc20",
          name: "Bridged USDC (Sonic Labs)",
          ticker: "USDC",
          delisted: false,
          disableCountervalue: false,
          units: [{ name: "Bridged USDC (Sonic Labs)", code: "USDC", magnitude: 6 }],
        };
        return bridgedUsdc;
      }

      return undefined;
    },
    getTokensSyncHash: async () => "",
  };

  setCryptoAssetsStore(mockStore);
});

describe("evm bridge", () => {
  const ethereum = getCryptoCurrencyById("ethereum");
  const sonic = getCryptoCurrencyById("sonic");
  const flare = getCryptoCurrencyById("flare");

  it("computes the token of a known asset", async () => {
    await expect(
      getTokenFromAsset(ethereum, {
        type: "erc20",
        assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      }),
    ).resolves.toMatchObject({
      id: "ethereum/erc20/usd__coin",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
    });

    await expect(
      getTokenFromAsset(sonic, {
        type: "erc20",
        assetReference: "0x29219dd400f2bf60e5a23d13be72b486d4038894",
      }),
    ).resolves.toMatchObject({
      id: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
      contractAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
      name: "Bridged USDC (Sonic Labs)",
    });
  });

  it("does not compute the token of an unknown asset", async () => {
    const mockStore = getCryptoAssetsStore();
    const findTokenByAddressInCurrency = jest.spyOn(mockStore, "findTokenByAddressInCurrency");

    await expect(
      getTokenFromAsset(ethereum, {
        type: "token",
        assetReference: "unknown-reference",
      }),
    ).resolves.toBeUndefined();

    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("unknown-reference", "ethereum");
  });

  it("computes the asset of an EVM token", () => {
    const token: TokenCurrency = {
      type: "TokenCurrency",
      id: "ethereum/erc20/usd__coin",
      parentCurrency: ethereum,
      tokenType: "erc20",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
    };

    expect(getAssetFromToken(ethereum, token, "owner")).toEqual({
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

  it("normalizes checksum when computing an EVM asset", () => {
    const token: TokenCurrency = {
      type: "TokenCurrency",
      id: "flare/erc20/fxrp",
      parentCurrency: flare,
      tokenType: "erc20",
      contractAddress: "0xad552a648c74d49e10027ab8a618a3ad4901c5be",
      name: "FXRP",
      ticker: "FXRP",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "FXRP", code: "FXRP", magnitude: 6 }],
    };

    expect(getAssetFromToken(flare, token, "owner")).toEqual({
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

  it("throws if token parent currency does not match", () => {
    const token: TokenCurrency = {
      type: "TokenCurrency",
      id: "usdc_on_ethereum",
      parentCurrency: ethereum,
      tokenType: "erc20",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
    };

    expect(() => getAssetFromToken(sonic, token, "owner")).toThrow(
      "'usdc_on_ethereum' is not a valid token for 'sonic'",
    );
  });
});
