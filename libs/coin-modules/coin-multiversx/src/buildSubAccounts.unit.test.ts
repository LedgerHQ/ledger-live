import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import network from "@ledgerhq/live-network";
import { Address } from "@multiversx/sdk-core/out";
import { ESDT_CONTRACT_ADDRESS_HEX } from "@multiversx/sdk-core/out/constants";
import BigNumber from "bignumber.js";
import MultiversXBuildESDTTokenAccounts from "./buildSubAccounts";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("MultiversXBuildESDTTokenAccounts", () => {
  beforeEach(() => {
    (network as jest.Mock).mockReset();
    (network as jest.Mock).mockImplementation(async ({ url }: { url: string }) => {
      const u = new URL(url);
      if (u.origin !== "https://elrond.coin.ledger.com") {
        throw new Error(`unexpected MultiversX API origin: ${u.origin} (url: ${url})`);
      }
      if (
        u.pathname ===
        "/accounts/erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx/tokens/count"
      ) {
        return { data: 1 };
      }
      if (
        u.pathname ===
          "/accounts/erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx/transactions/count" &&
        u.searchParams.has("token")
      ) {
        return { data: 0 };
      }
      if (
        u.pathname ===
          "/accounts/erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx/tokens" &&
        u.searchParams.has("from")
      ) {
        return {
          data: [{ identifier: "USDC-c76f1f", name: "USDC", balance: "100" }],
        };
      }
      if (
        u.pathname ===
          "/accounts/erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx/transactions" &&
        u.searchParams.has("token")
      ) {
        return { data: [] };
      }
      throw new Error(`unexpected network url: ${url}`);
    });
  });

  it("discovers ESDT via findTokenByAddressInCurrency", async () => {
    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(undefined),
    });

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: { id: "elrond" } as CryptoCurrency,
      accountId: "",
      accountAddress: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
      existingAccount: undefined,
      syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
    });

    expect(result).toEqual([]);
    expect(getCryptoAssetsStore().findTokenByAddressInCurrency).toHaveBeenCalledWith(
      Address.fromHex(ESDT_CONTRACT_ADDRESS_HEX).toBech32(),
      "elrond",
      "USDC-c76f1f",
    );
  });

  it("skips blacklisted CAL tokens", async () => {
    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue({
        id: `elrond/esdt/${Buffer.from("USDC-c76f1f").toString("hex")}`,
        ticker: "USDC",
      } as TokenCurrency),
    });

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: { id: "elrond" } as CryptoCurrency,
      accountId: "",
      accountAddress: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
      existingAccount: undefined,
      syncConfig: {
        paginationConfig: {},
        blacklistedTokenIds: [`elrond/esdt/${Buffer.from("USDC-c76f1f").toString("hex")}`],
      },
    });

    expect(result).toEqual([]);
    expect(getCryptoAssetsStore().findTokenByAddressInCurrency).toHaveBeenCalledWith(
      Address.fromHex(ESDT_CONTRACT_ADDRESS_HEX).toBech32(),
      "elrond",
      "USDC-c76f1f",
    );
  });

  it("builds a token account when CAL returns a token", async () => {
    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue({
        id: `elrond/esdt/${Buffer.from("USDC-c76f1f").toString("hex")}`,
        ticker: "USDC",
      } as TokenCurrency),
    });

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: { id: "elrond" } as CryptoCurrency,
      accountId: "",
      accountAddress: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
      existingAccount: undefined,
      syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
    });

    expect(result).toEqual([
      expect.objectContaining({
        type: "TokenAccount",
        balance: new BigNumber("100"),
        token: expect.objectContaining({
          id: "elrond/esdt/555344432d633736663166",
          ticker: "USDC",
        }),
      }),
    ]);
    expect(getCryptoAssetsStore().findTokenByAddressInCurrency).toHaveBeenCalledWith(
      Address.fromHex(ESDT_CONTRACT_ADDRESS_HEX).toBech32(),
      "elrond",
      "USDC-c76f1f",
    );
  });
});
