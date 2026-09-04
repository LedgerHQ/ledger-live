import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { resolvePrefillAddAddressParams } from "../resolvePrefillAddAddressParams";

describe("resolvePrefillAddAddressParams", () => {
  const ethereum = getCryptoCurrencyById("ethereum");
  const address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

  it("should map a crypto currency to prefill params", () => {
    expect(
      resolvePrefillAddAddressParams({
        address,
        currency: ethereum,
      }),
    ).toEqual({
      address,
      currency: {
        currencyId: ethereum.id,
        assetDisplayName: ethereum.name,
      },
      network: {
        networkId: ethereum.id,
        displayName: ethereum.name,
      },
    });
  });

  it("should map a token currency to its parent network", () => {
    const usdt = {
      type: "TokenCurrency",
      id: "ethereum/erc20/usd_tether",
      parentCurrencyId: ethereum.id,
      contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      tokenType: "erc20",
      name: "Tether USD",
      ticker: "USDT",
      units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
    } as TokenCurrency;

    expect(
      resolvePrefillAddAddressParams({
        address,
        currency: usdt,
      }),
    ).toEqual({
      address,
      currency: {
        currencyId: usdt.id,
        assetDisplayName: usdt.name,
      },
      network: {
        networkId: ethereum.id,
        displayName: ethereum.name,
      },
    });
  });

  it("should return undefined when the address or currency is missing", () => {
    expect(
      resolvePrefillAddAddressParams({
        address: "   ",
        currency: ethereum,
      }),
    ).toBeUndefined();
    expect(
      resolvePrefillAddAddressParams({
        address,
        currency: null,
      }),
    ).toBeUndefined();
  });
});
