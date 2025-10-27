import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens as addTokensLegacy } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { setCryptoAssetsStoreGetter } from "../cryptoAssetsStore";
import { getAssetFromToken, getTokenFromAsset } from "./getTokenFromAsset";
import "../__tests__/fixtures/cryptoAssetsStore.fixtures";

beforeAll(async () => {
  initializeLegacyTokens(addTokensLegacy);
  setCryptoAssetsStoreGetter(() => legacyCryptoAssetsStore);
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
    const findTokenByAddressInCurrency = jest.spyOn(
      legacyCryptoAssetsStore,
      "findTokenByAddressInCurrency",
    );

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
