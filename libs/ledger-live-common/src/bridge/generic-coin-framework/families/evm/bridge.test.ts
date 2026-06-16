import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getCryptoAssetsStore, setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import evmBridge, { computeIntentType, getAssetFromToken, getTokenFromAsset } from "./bridge";

describe("evm bridge", () => {
  const ethereum = getCryptoCurrencyById("ethereum");
  const sonic = getCryptoCurrencyById("sonic");
  const flare = getCryptoCurrencyById("flare");

  beforeAll(() => {
    const mockStore: Parameters<typeof setCryptoAssetsStore>[0] = {
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
            parentCurrencyId: "ethereum",
            tokenType: "erc20",
            name: "USD Coin",
            ticker: "USDC",
            delisted: false,
            disableCountervalue: false,
            units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
          };
        }

        if (
          normalizedAddress === "0x29219dd400f2bf60e5a23d13be72b486d4038894" &&
          currencyId === "sonic"
        ) {
          return {
            type: "TokenCurrency",
            id: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
            contractAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
            parentCurrencyId: "sonic",
            tokenType: "erc20",
            name: "Bridged USDC (Sonic Labs)",
            ticker: "USDC",
            delisted: false,
            disableCountervalue: false,
            units: [{ name: "Bridged USDC (Sonic Labs)", code: "USDC", magnitude: 6 }],
          };
        }

        return undefined;
      },
      getTokensSyncHash: async () => "",
    };

    setCryptoAssetsStore(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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
    const findTokenByAddressInCurrency = jest.spyOn(
      getCryptoAssetsStore(),
      "findTokenByAddressInCurrency",
    );

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
      parentCurrencyId: "ethereum",
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
      parentCurrencyId: "flare",
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
      parentCurrencyId: "ethereum",
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

  describe("computeIntentType", () => {
    it.each([
      ["send-eip1559", "a 'send-eip1559' mode", { mode: "send-eip1559" }],
      ["send-eip1559", "a 'send' mode and '2' type", { mode: "send", type: 2 }],
      ["send-legacy", "a 'send-legacy' mode", { mode: "send-legacy" }],
      ["send-legacy", "a 'send' mode and '0' type", { mode: "send", type: 0 }],
      ["send-legacy", "a 'send' mode no type", { mode: "send" }],
      ["staking-eip1559", "a 'delegate' mode and '2' type", { mode: "delegate", type: 2 }],
      ["staking-eip1559", "a 'redelegate' mode and '2' type", { mode: "redelegate", type: 2 }],
      ["staking-eip1559", "a 'undelegate' mode and '2' type", { mode: "undelegate", type: 2 }],
      ["staking-eip1559", "a 'claimReward' mode and '2' type", { mode: "claimReward", type: 2 }],
      ["staking-legacy", "a 'delegate' mode", { mode: "delegate" }],
      ["staking-legacy", "a 'redelegate' mode", { mode: "redelegate" }],
      ["staking-legacy", "a 'undelegate' mode", { mode: "undelegate" }],
      ["staking-legacy", "a 'claimReward' mode", { mode: "claimReward" }],
    ])("detects a '%s' type from %s", (expectedType, _s, transaction) => {
      expect(computeIntentType(transaction)).toEqual(expectedType);
    });

    it("throws on unsupported transaction mode", () => {
      expect(() => computeIntentType({ mode: undefined })).toThrow(
        "Unsupported transaction mode: undefined",
      );
      expect(() => computeIntentType({ mode: "any" })).toThrow(
        "Unsupported transaction mode: 'any'",
      );
    });
  });

  describe("getBalanceOptions", () => {
    const bridgeApi = evmBridge(ethereum);

    it("should return a defined BalanceOptions", () => {
      expect(bridgeApi.balanceOptions).toBeDefined();

      const result = bridgeApi.balanceOptions;
      expect(result).toEqual({
        includeAssets: expect.any(Function),
      });
    });

    it("should accept supported tokens from includeAssets", async () => {
      const supportedAsset = {
        type: "erc20",
        assetReference: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      };

      expect(bridgeApi.balanceOptions).toBeDefined();
      const balanceOptions = bridgeApi.balanceOptions;

      expect(await balanceOptions!.includeAssets!(supportedAsset)).toEqual(true);
    });

    it("should reject unsupported tokens from includeAssets", async () => {
      const unsupportedAsset = {
        type: "erc20",
        assetReference: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
      };

      const balanceOptions = bridgeApi.balanceOptions;
      expect(await balanceOptions!.includeAssets!(unsupportedAsset)).toEqual(false);
    });

    it("should not filter native asset from includeAssets", async () => {
      const findTokenByAddressInCurrencySpy = jest.spyOn(
        getCryptoAssetsStore(),
        "findTokenByAddressInCurrency",
      );

      const nativeAsset = {
        type: "native",
        name: "ethereum",
      };

      const balanceOptions = bridgeApi.balanceOptions;
      expect(await balanceOptions!.includeAssets!(nativeAsset)).toEqual(true);

      expect(findTokenByAddressInCurrencySpy).not.toHaveBeenCalled();
    });
  });
});
