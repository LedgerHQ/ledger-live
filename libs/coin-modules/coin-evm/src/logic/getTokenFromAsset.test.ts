import * as tokenModule from "@ledgerhq/cryptoassets/tokens";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import * as legacy from "@ledgerhq/cryptoassets/tokens";
import { setCryptoAssetsStoreGetter } from "../cryptoAssetsStore";
import { getAssetFromToken, getTokenFromAsset } from "./getTokenFromAsset";

describe("getTokenFromAsset", () => {
  beforeAll(() => {
    setCryptoAssetsStoreGetter(() => legacy);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("computes the token of the USDC asset, trusting the CAL", async () => {
    const findTokenByAddressInCurrency = jest.spyOn(tokenModule, "findTokenByAddressInCurrency");

    expect(
      await getTokenFromAsset({ id: "ethereum" } as CryptoCurrency, {
        type: "erc20",
        assetReference: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      }),
    ).toMatchObject({
      id: "ethereum/erc20/usd__coin",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
    });
    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "ethereum",
    );
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
    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
      "0x29219dd400f2bf60e5a23d13be72b486d4038894",
      "sonic",
    );
  });

  it("does not compute the token of an unknown asset, trusting the CAL", async () => {
    const findTokenByAddressInCurrency = jest.spyOn(tokenModule, "findTokenByAddressInCurrency");

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
