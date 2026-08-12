import { mockContactAddress } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { resolveContactsCurrencyAnalytics } from "./resolveContactsCurrencyAnalytics";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: jest.fn(),
}));

const mockedGetCryptoAssetsStore = jest.mocked(getCryptoAssetsStore);

describe("resolveContactsCurrencyAnalytics", () => {
  beforeEach(() => {
    mockedGetCryptoAssetsStore.mockReset();
  });

  it("should resolve a native crypto currency from the registry", async () => {
    const ethereum = getCryptoCurrencyById("ethereum");

    await expect(resolveContactsCurrencyAnalytics(ethereum.id)).resolves.toEqual({
      network: ethereum.name,
      asset: ethereum.ticker,
    });
    expect(mockedGetCryptoAssetsStore).not.toHaveBeenCalled();
  });

  it("should resolve a token from the crypto assets store", async () => {
    mockedGetCryptoAssetsStore.mockReturnValue({
      findTokenById: jest.fn().mockResolvedValue({
        parentCurrencyId: "ethereum",
        ticker: "USDC",
      }),
      findTokenByAddressInCurrency: jest.fn(),
      getTokensSyncHash: jest.fn(),
    });

    await expect(
      resolveContactsCurrencyAnalytics(
        mockContactAddress({ currencyId: "ethereum/erc20/usd_coin" }).currencyId,
      ),
    ).resolves.toEqual({
      network: getCryptoCurrencyById("ethereum").name,
      asset: "USDC",
    });
  });

  it("should fall back to the parent network when the token store is unavailable", async () => {
    mockedGetCryptoAssetsStore.mockImplementation(() => {
      throw new Error("Framework crypto assets store not initialized.");
    });

    await expect(
      resolveContactsCurrencyAnalytics(
        mockContactAddress({ currencyId: "ethereum/erc20/usd_coin" }).currencyId,
      ),
    ).resolves.toEqual({
      network: getCryptoCurrencyById("ethereum").name,
      asset: "ethereum/erc20/usd_coin",
    });
  });
});
