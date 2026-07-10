import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { createCurrencyListHandler } from "../currencyList";
import { getDepsFrom, makeHandlerDeps } from "./testHelpers";

const listSupportedCurrencies = jest.fn();
const isWalletAPISupportedCurrency = jest.fn();
const currencyToWalletAPICurrency = jest.fn();
const getTokensDataInitiate = jest.fn();
const findTokenById = jest.fn();

jest.mock("../../../currencies", () => ({
  listSupportedCurrencies: () => listSupportedCurrencies(),
}));

jest.mock("../../helpers", () => ({
  isWalletAPISupportedCurrency: (c: unknown) => isWalletAPISupportedCurrency(c),
}));

jest.mock("../../converters", () => ({
  currencyToWalletAPICurrency: (c: { id: string }) => currencyToWalletAPICurrency(c),
}));

jest.mock("@domain/api-currency-token", () => ({
  cryptoAssetsApi: {
    endpoints: {
      getTokensData: {
        initiate: (...args: unknown[]) => getTokensDataInitiate(...args),
      },
    },
  },
}));

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: () => ({
    findTokenById: (id: string) => findTokenById(id),
  }),
}));

function crypto(id: string, family = "ethereum"): CryptoCurrency {
  return { id, family, type: "CryptoCurrency" } as CryptoCurrency;
}

const baseManifest = makeHandlerDeps().manifest;

describe("createCurrencyListHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isWalletAPISupportedCurrency.mockReturnValue(true);
    currencyToWalletAPICurrency.mockImplementation((c: { id: string }) => ({
      id: c.id,
    }));
    findTokenById.mockResolvedValue(null);
    listSupportedCurrencies.mockReturnValue([]);
  });

  it("returns all supported currencies for '*' manifest (excluding deactivated)", async () => {
    listSupportedCurrencies.mockReturnValue([crypto("ethereum"), crypto("bitcoin", "bitcoin")]);
    // includeAllCurrencies triggers a token fetch per crypto family; stub empty pages.
    const unsubscribe = jest.fn();
    const dispatch = jest.fn(() =>
      Object.assign(
        Promise.resolve({
          data: { pages: [] },
          hasNextPage: false,
          error: undefined,
        }),
        {
          unsubscribe,
        },
      ),
    );
    const handler = createCurrencyListHandler(
      getDepsFrom(
        makeHandlerDeps({
          manifest: { ...baseManifest, currencies: "*" },
          deactivatedCurrencyIds: new Set(["bitcoin"]),
          dispatch,
        }),
      ),
    );

    const result = await handler({});

    // bitcoin is deactivated -> only ethereum included; ethereum family fetch yields no tokens.
    expect(result.map(c => c.id)).toEqual(["ethereum"]);
  });

  it("filters down to specific currencies from the manifest allowlist", async () => {
    listSupportedCurrencies.mockReturnValue([crypto("ethereum"), crypto("bitcoin", "bitcoin")]);
    const handler = createCurrencyListHandler(
      getDepsFrom(
        makeHandlerDeps({
          manifest: { ...baseManifest, currencies: ["bitcoin"] },
        }),
      ),
    );

    const result = await handler({});

    expect(result.map(c => c.id)).toEqual(["bitcoin"]);
  });

  it("intersects manifest allowlist with the query currencyIds", async () => {
    listSupportedCurrencies.mockReturnValue([crypto("ethereum"), crypto("bitcoin", "bitcoin")]);
    const handler = createCurrencyListHandler(
      getDepsFrom(
        makeHandlerDeps({
          manifest: { ...baseManifest, currencies: ["bitcoin", "ethereum"] },
        }),
      ),
    );

    const result = await handler({ currencyIds: ["ethereum", "polkadot"] });

    expect(result.map(c => c.id)).toEqual(["ethereum"]);
  });

  it("expands a '*' manifest to the query currencyIds when a query is provided", async () => {
    listSupportedCurrencies.mockReturnValue([crypto("ethereum"), crypto("bitcoin", "bitcoin")]);
    const handler = createCurrencyListHandler(
      getDepsFrom(makeHandlerDeps({ manifest: { ...baseManifest, currencies: "*" } })),
    );

    const result = await handler({ currencyIds: ["bitcoin"] });

    expect(result.map(c => c.id)).toEqual(["bitcoin"]);
  });

  it("intersects a 'family/**' manifest with the query, keeping only in-family token ids", async () => {
    listSupportedCurrencies.mockReturnValue([]);
    findTokenById.mockImplementation(async (id: string) => ({
      id,
      type: "TokenCurrency",
    }));
    const handler = createCurrencyListHandler(
      getDepsFrom(
        makeHandlerDeps({
          manifest: { ...baseManifest, currencies: ["ethereum/**"] },
        }),
      ),
    );

    // "ethereum/erc20/a" stays (startsWith "ethereum/"), "bitcoin/x" is dropped.
    const result = await handler({
      currencyIds: ["ethereum/erc20/a", "bitcoin/x"],
    });

    expect(findTokenById).toHaveBeenCalledTimes(1);
    expect(findTokenById).toHaveBeenCalledWith("ethereum/erc20/a");
    expect(result.map(c => c.id)).toEqual(["ethereum/erc20/a"]);
  });

  it("excludes unsupported currencies via isWalletAPISupportedCurrency", async () => {
    listSupportedCurrencies.mockReturnValue([crypto("ethereum"), crypto("bitcoin", "bitcoin")]);
    isWalletAPISupportedCurrency.mockImplementation((c: { id: string }) => c.id !== "bitcoin");
    const handler = createCurrencyListHandler(
      getDepsFrom(makeHandlerDeps({ manifest: { ...baseManifest, currencies: "*" } })),
    );

    const result = await handler({});

    expect(result.map(c => c.id)).toEqual(["ethereum"]);
  });

  it("resolves specific token ids via the crypto assets store", async () => {
    listSupportedCurrencies.mockReturnValue([]);
    findTokenById.mockImplementation(async (id: string) =>
      id === "ethereum/erc20/usdt" ? { id, type: "TokenCurrency" } : null,
    );
    const handler = createCurrencyListHandler(
      getDepsFrom(
        makeHandlerDeps({
          manifest: {
            ...baseManifest,
            currencies: ["ethereum/erc20/usdt", "ethereum/erc20/missing"],
          },
        }),
      ),
    );

    const result = await handler({});

    expect(findTokenById).toHaveBeenCalledTimes(2);
    expect(result.map(c => c.id)).toEqual(["ethereum/erc20/usdt"]);
  });

  it("fetches token families (family/**) through the dispatch + CAL pagination", async () => {
    listSupportedCurrencies.mockReturnValue([]);
    // RTK infinite query accumulates pages: the second result's data.pages holds both pages.
    const querySub1 = Promise.resolve({
      data: { pages: [{ tokens: [{ id: "ethereum/erc20/a" }] }] },
      hasNextPage: true,
      error: undefined,
    });
    const querySub2 = Promise.resolve({
      data: {
        pages: [{ tokens: [{ id: "ethereum/erc20/a" }] }, { tokens: [{ id: "ethereum/erc20/b" }] }],
      },
      hasNextPage: false,
      error: undefined,
    });
    const unsubscribe = jest.fn();
    const subs = [querySub1, querySub2].map(p => Object.assign(p, { unsubscribe }));
    let call = 0;
    const dispatch = jest.fn(() => subs[call++]);
    getTokensDataInitiate.mockImplementation((args, opts) => ({ args, opts }));

    const handler = createCurrencyListHandler(
      getDepsFrom(
        makeHandlerDeps({
          manifest: { ...baseManifest, currencies: ["ethereum/**"] },
          dispatch,
        }),
      ),
    );

    const result = await handler({});

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(unsubscribe).toHaveBeenCalledTimes(2);
    // First call has no direction option, follow-up uses forward direction.
    expect(getTokensDataInitiate).toHaveBeenNthCalledWith(
      1,
      { networkFamily: "ethereum", pageSize: 1000 },
      undefined,
    );
    expect(getTokensDataInitiate).toHaveBeenNthCalledWith(
      2,
      { networkFamily: "ethereum", pageSize: 1000 },
      { direction: "forward" },
    );
    expect(result.map(c => c.id)).toEqual(["ethereum/erc20/a", "ethereum/erc20/b"]);
  });

  it("propagates errors from the token data query and still unsubscribes", async () => {
    listSupportedCurrencies.mockReturnValue([]);
    const error = new Error("cal boom");
    const unsubscribe = jest.fn();
    const querySub = Object.assign(
      Promise.resolve({ data: undefined, hasNextPage: false, error }),
      { unsubscribe },
    );
    const dispatch = jest.fn(() => querySub);

    const handler = createCurrencyListHandler(
      getDepsFrom(
        makeHandlerDeps({
          manifest: { ...baseManifest, currencies: ["ethereum/**"] },
          dispatch,
        }),
      ),
    );

    await expect(handler({})).rejects.toBe(error);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
