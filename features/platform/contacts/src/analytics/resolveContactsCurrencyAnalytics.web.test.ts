import { mockContactAddress } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  resolveContactsCurrencyAnalytics,
  type ResolveContactsCurrencyAnalyticsDependencies,
} from "./resolveContactsCurrencyAnalytics";

function createDependencies(
  findTokenById: ResolveContactsCurrencyAnalyticsDependencies["findTokenById"],
): ResolveContactsCurrencyAnalyticsDependencies {
  return { findTokenById };
}

describe("resolveContactsCurrencyAnalytics", () => {
  it("should resolve a native crypto currency from the registry", async () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const findTokenById = jest.fn();

    await expect(
      resolveContactsCurrencyAnalytics(ethereum.id, createDependencies(findTokenById)),
    ).resolves.toEqual({
      network: ethereum.name,
      asset: ethereum.ticker,
    });
    expect(findTokenById).not.toHaveBeenCalled();
  });

  it("should resolve a token from the crypto assets store", async () => {
    const findTokenById = jest.fn().mockResolvedValue({
      parentCurrencyId: "ethereum",
      ticker: "USDC",
    });

    await expect(
      resolveContactsCurrencyAnalytics(
        mockContactAddress({ currencyId: "ethereum/erc20/usd_coin" }).currencyId,
        createDependencies(findTokenById),
      ),
    ).resolves.toEqual({
      network: getCryptoCurrencyById("ethereum").name,
      asset: "USDC",
    });
  });

  it("should fall back to the parent network when the token store is unavailable", async () => {
    const findTokenById = jest.fn().mockRejectedValue(new Error("token lookup unavailable"));

    await expect(
      resolveContactsCurrencyAnalytics(
        mockContactAddress({ currencyId: "ethereum/erc20/usd_coin" }).currencyId,
        createDependencies(findTokenById),
      ),
    ).resolves.toEqual({
      network: getCryptoCurrencyById("ethereum").name,
      asset: "ethereum/erc20/usd_coin",
    });
  });

  it("should fall back to the token parent id when the parent currency is unknown", async () => {
    const findTokenById = jest.fn().mockResolvedValue({
      parentCurrencyId: "unknown-network",
      ticker: "TKN",
    });

    await expect(
      resolveContactsCurrencyAnalytics(
        mockContactAddress({ currencyId: "unknown-network/erc20/token" }).currencyId,
        createDependencies(findTokenById),
      ),
    ).resolves.toEqual({
      network: "unknown-network",
      asset: "TKN",
    });
  });

  it("should fall back to the currency id when no token or parent currency is found", async () => {
    const findTokenById = jest.fn().mockResolvedValue(undefined);

    await expect(
      resolveContactsCurrencyAnalytics(
        mockContactAddress({ currencyId: "unknown-network/erc20/token" }).currencyId,
        createDependencies(findTokenById),
      ),
    ).resolves.toEqual({
      network: "unknown-network/erc20/token",
      asset: "unknown-network/erc20/token",
    });
  });
});
