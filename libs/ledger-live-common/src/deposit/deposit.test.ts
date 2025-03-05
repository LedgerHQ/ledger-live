import { groupCurrenciesByProvider, searchByNameOrTicker, searchByProviderId } from "./helper";
import { MOCK_TOKENS_ONLY, MOCK_WITH_TOKEN_AND_CURRENCY_ASSET, MOCK_IDS, MOCK_POL } from "./mock";
import { MappedAsset } from "./type";
import {
  getCryptoCurrencyById,
  getTokenById,
  setSupportedCurrencies,
  sortCurrenciesByIds,
} from "../currencies/index";
import { isCurrencySupported, listSupportedCurrencies, listTokens } from "../currencies";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

const TOKEN_ONLY_ASSETS = MOCK_TOKENS_ONLY as MappedAsset[];

const listSupportedTokens = () => listTokens().filter(t => isCurrencySupported(t.parentCurrency));

describe("Deposit logic", () => {
  afterEach(() => {
    setSupportedCurrencies([]);
  });
  test("searchByProviderId", () => {
    const result = searchByProviderId(TOKEN_ONLY_ASSETS, "tether");
    expect(result).toEqual(TOKEN_ONLY_ASSETS);
  });

  test("searchByNameOrTicker", () => {
    const result = searchByNameOrTicker(TOKEN_ONLY_ASSETS, "usdt");
    expect(result.length).toBeGreaterThan(0);
  });

  test("groupCurrenciesByProvider", () => {
    const currencies = TOKEN_ONLY_ASSETS.map(asset => getTokenById(asset.ledgerId));
    const { currenciesByProvider } = groupCurrenciesByProvider(TOKEN_ONLY_ASSETS, currencies);

    expect(currenciesByProvider).toEqual([
      {
        providerId: "tether",
        currenciesByNetwork: currencies,
      },
    ]);

    const currenciesPol = MOCK_POL.map(asset =>
      asset.$type === "Token"
        ? getTokenById(asset.ledgerId)
        : getCryptoCurrencyById(asset.ledgerId),
    );

    setSupportedCurrencies(["polygon", "ethereum", "bsc"]);

    const supportedCurrencies = sortCurrenciesByIds(
      (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
      MOCK_IDS,
    );
    const { currenciesByProvider: currenciesByProviderBis, sortedCryptoCurrencies } =
      groupCurrenciesByProvider(MOCK_POL as MappedAsset[], supportedCurrencies);
    expect(currenciesByProviderBis).toEqual([
      {
        providerId: "matic-network",
        currenciesByNetwork: currenciesPol,
      },
    ]);

    expect(sortedCryptoCurrencies).toEqual(currenciesPol);
  });

  it("should return Arbitrum and not Optimism in the sortedCryptoCurrencies", () => {
    setSupportedCurrencies(["arbitrum", "arbitrum_sepolia"]);
    const currencies = sortCurrenciesByIds(
      (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
      MOCK_IDS,
    );

    const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
      MOCK_WITH_TOKEN_AND_CURRENCY_ASSET as MappedAsset[],
      currencies,
    );
    expect(sortedCryptoCurrencies).toEqual([getCryptoCurrencyById("arbitrum")]);
  });

  it("should return Optimism only in the sortedCryptoCurrencies", () => {
    setSupportedCurrencies(["optimism", "optimism_sepolia"]);
    const currencies = sortCurrenciesByIds(
      (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
      MOCK_IDS,
    );

    const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
      MOCK_WITH_TOKEN_AND_CURRENCY_ASSET as MappedAsset[],
      currencies,
    );
    expect(sortedCryptoCurrencies).toEqual([getCryptoCurrencyById("optimism")]);
  });

  it("should return Arbitrum and Optimism in the sortedCryptoCurrencies", () => {
    setSupportedCurrencies(["optimism", "optimism_sepolia", "arbitrum", "arbitrum_sepolia"]);
    const currencies = sortCurrenciesByIds(
      (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
      MOCK_IDS,
    );

    const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
      MOCK_WITH_TOKEN_AND_CURRENCY_ASSET as MappedAsset[],
      currencies,
    );
    expect(sortedCryptoCurrencies).toEqual([
      getCryptoCurrencyById("optimism"),
      getCryptoCurrencyById("arbitrum"),
    ]);
  });

  // Token only case

  it("should return only Polygon token while its currency is supported in the list", () => {
    setSupportedCurrencies(["polygon"]);

    const currencies = sortCurrenciesByIds(
      (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
      MOCK_IDS,
    );
    const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
      MOCK_TOKENS_ONLY as MappedAsset[],
      currencies,
    );
    expect(sortedCryptoCurrencies).toEqual([getTokenById("polygon/erc20/(pos)_tether_usd")]);
    expect(true).toBe(true);
  });

  it("should return only BSC token while its currency is supported in the list", () => {
    setSupportedCurrencies(["bsc"]);

    const currencies = sortCurrenciesByIds(
      (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
      MOCK_IDS,
    );
    const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
      MOCK_TOKENS_ONLY as MappedAsset[],
      currencies,
    );
    expect(sortedCryptoCurrencies).toEqual([getTokenById("bsc/bep20/binance-peg_bsc-usd")]);
    expect(true).toBe(true);
  });

  it("should return all the tokens by ignoring duplicates while Tether USD exists on both etherum and bsc currencies ", () => {
    setSupportedCurrencies(["ethereum", "bsc", "polygon"]);

    const currencies = sortCurrenciesByIds(
      (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
      MOCK_IDS,
    );
    const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
      MOCK_TOKENS_ONLY as MappedAsset[],
      currencies,
    );
    expect(sortedCryptoCurrencies).toEqual([
      getTokenById("ethereum/erc20/usd_tether__erc20_"),
      getTokenById("polygon/erc20/(pos)_tether_usd"),
    ]);
    expect(true).toBe(true);
  });

  it("sould return empty array where no supported currencies", () => {
    setSupportedCurrencies([]);
    const currencies = sortCurrenciesByIds(
      (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
      MOCK_IDS,
    );

    const { sortedCryptoCurrencies } = groupCurrenciesByProvider(
      [...TOKEN_ONLY_ASSETS, ...MOCK_WITH_TOKEN_AND_CURRENCY_ASSET] as MappedAsset[],
      currencies,
    );
    expect(sortedCryptoCurrencies).toEqual([]);
  });
});
