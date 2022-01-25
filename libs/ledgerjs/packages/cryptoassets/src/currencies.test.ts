import {
  listFiatCurrencies,
  getFiatCurrencyByTicker,
  hasFiatCurrencyTicker,
} from "./fiats";
import {
  listTokens,
  findTokenById,
  findTokenByAddressInCurrency,
} from "./tokens";
import {
  listCryptoCurrencies,
  hasCryptoCurrencyId,
  getCryptoCurrencyById,
  findCryptoCurrency,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  findCryptoCurrencyByTicker,
  findCryptoCurrencyByKeyword,
  registerCryptoCurrency,
} from "./currencies";
import { CryptoCurrency } from "./types";

test("can get currency by coin type", () => {
  expect(getCryptoCurrencyById("bitcoin")).toMatchObject({
    id: "bitcoin",
    name: "Bitcoin",
  });
  expect(getCryptoCurrencyById("litecoin")).toMatchObject({
    id: "litecoin",
    name: "Litecoin",
  });
  expect(hasCryptoCurrencyId("bitcoin")).toBe(true);
  expect(hasCryptoCurrencyId("")).toBe(false);
  expect(() => getCryptoCurrencyById("")).toThrow();
  expect(hasCryptoCurrencyId("_")).toBe(false);
  expect(() => getCryptoCurrencyById("_")).toThrow();
});

test("can find currency", () => {
  const bitcoinMatch = {
    id: "bitcoin",
    name: "Bitcoin",
  };
  expect(findCryptoCurrency((c) => c.name === "Bitcoin")).toMatchObject(
    bitcoinMatch
  );
  expect(findCryptoCurrencyById("bitcoin")).toMatchObject(bitcoinMatch);
  expect(findCryptoCurrencyByKeyword("btc")).toMatchObject(bitcoinMatch);
  expect(findCryptoCurrencyByKeyword("btc")).toMatchObject(bitcoinMatch);
  expect(findCryptoCurrencyByKeyword("btc")).toMatchObject(bitcoinMatch);
  expect(findCryptoCurrencyByTicker("BTC")).toMatchObject(bitcoinMatch);
  expect(findCryptoCurrencyByScheme("bitcoin")).toMatchObject(bitcoinMatch);
  expect(findCryptoCurrencyById("_")).toBe(undefined);
  expect(findCryptoCurrencyByKeyword("_")).toBe(undefined);
  expect(findCryptoCurrencyByKeyword("_")).toBe(undefined);
  expect(findCryptoCurrencyByKeyword("_")).toBe(undefined);
  expect(findCryptoCurrencyByTicker("_")).toBe(undefined);
  expect(findCryptoCurrencyByScheme("_")).toBe(undefined);
});

test("there are some dev cryptocurrencies", () => {
  const all = listCryptoCurrencies(true);
  const prod = listCryptoCurrencies();
  expect(all).not.toBe(prod);
  expect(all.filter((a) => !a.isTestnetFor)).toMatchObject(prod);
  expect(all.length).toBeGreaterThan(prod.length);
});

test("there are some terminated cryptocurrencies", () => {
  const all = listCryptoCurrencies(false, true);
  const supported = listCryptoCurrencies();
  expect(all).not.toBe(supported);
  expect(all.filter((a) => !a.terminated)).toMatchObject(supported);
  expect(all.length).toBeGreaterThan(supported.length);
});

test("all cryptocurrencies match (by reference) the one you get by id", () => {
  for (const c of listCryptoCurrencies()) {
    expect(c).toBe(getCryptoCurrencyById(c.id));
  }
});

test("there is no testnet or terminated coin by default", () => {
  expect(listCryptoCurrencies(false, false)).toBe(listCryptoCurrencies());
  expect(listCryptoCurrencies(true, true).length).toBeGreaterThan(
    listCryptoCurrencies().length
  );

  for (const c of listCryptoCurrencies()) {
    expect(!c.terminated).toBe(true);
    expect(!c.isTestnetFor).toBe(true);
  }
});

test("all cryptocurrencies have at least one unit", () => {
  for (const c of listCryptoCurrencies()) {
    expect(c.units.length).toBeGreaterThan(0);
  }
});

test("fiats list is always the same", () => {
  expect(listFiatCurrencies()).toEqual(listFiatCurrencies());
});

test("fiats list elements are correct", () => {
  const tickers = {};

  for (const fiat of listFiatCurrencies()) {
    expect(fiat.ticker).toBeTruthy();
    expect(typeof fiat.ticker).toBe("string");
    expect(tickers[fiat.ticker]).toBeFalsy();
    expect(fiat.units.length).toBeGreaterThan(0);
    const unit = fiat.units[0];
    expect(unit.code).toBeTruthy();
    expect(typeof unit.code).toBe("string");
    expect(unit.name).toBeTruthy();
    expect(typeof unit.name).toBe("string");
    expect(unit.magnitude).toBeGreaterThan(-1);
    expect(typeof unit.magnitude).toBe("number");
    tickers[fiat.ticker] = unit;
  }
});

test("tokens are correct", () => {
  expect(listTokens().length).toBeGreaterThan(0);

  for (const token of listTokens()) {
    expect(token.ticker).toBeTruthy();
    expect(typeof token.id).toBe("string");
    expect(typeof token.name).toBe("string");

    if (token.ledgerSignature) {
      expect(typeof token.ledgerSignature).toBe("string");
    }

    expect(typeof token.tokenType).toBe("string");
    expect(typeof token.parentCurrency).toBe("object");
    expect(hasCryptoCurrencyId(token.parentCurrency.id)).toBe(true);
    expect(typeof token.ticker).toBe("string");
    expect(token.units.length).toBeGreaterThan(0);
    const unit = token.units[0];
    expect(unit.code).toBeTruthy();
    expect(typeof unit.code).toBe("string");
    expect(unit.name).toBeTruthy();
    expect(typeof unit.name).toBe("string");
    expect(unit.magnitude).toBeGreaterThan(-1);
    expect(typeof unit.magnitude).toBe("number");

    if (token.compoundFor) {
      const t = findTokenById(token.compoundFor);
      expect(typeof t).toBe("object");
    }
  }
});

test("findTokenByAddressInCurrency", () => {
  expect(
    findTokenByAddressInCurrency(
      "0x111111111117dC0aa78b770fA6A738034120C302",
      "bsc"
    )
  ).toMatchObject({
    id: "bsc/bep20/1inch_token",
  });
  expect(
    findTokenByAddressInCurrency(
      "0x111111111117dC0aa78b770fA6A738034120C302",
      "ethereum"
    )
  ).toMatchObject({
    id: "ethereum/erc20/1inch_token",
  });
  expect(findTokenByAddressInCurrency("0x0", "bsc")).toBe(undefined);
  expect(
    findTokenByAddressInCurrency(
      "0x111111111117dC0aa78b770fA6A738034120C302",
      "tron"
    )
  ).toBe(undefined);
});

test("fiats list is sorted by ticker", () => {
  expect(
    listFiatCurrencies()
      .map((fiat) => fiat.ticker)
      .join(",")
  ).toEqual(
    listFiatCurrencies()
      .map((fiat) => fiat.ticker)
      .sort((a, b) => (a > b ? 1 : -1))
      .join(",")
  );
});

test("can get fiat by coin type", () => {
  expect(getFiatCurrencyByTicker("USD").units[0]).toMatchObject({
    magnitude: 2,
  });
  expect(getFiatCurrencyByTicker("EUR").units[0]).toMatchObject({
    magnitude: 2,
  });
  // this is not a fiat \o/
  expect(() => getFiatCurrencyByTicker("USDT").units[0]).toThrow();
  expect(hasFiatCurrencyTicker("USD")).toBe(true);
  expect(hasFiatCurrencyTicker("USDT")).toBe(false);
});

test("all USDT are countervalue enabled", () => {
  const tokens = listTokens().filter(
    (t) => t.ticker === "USDT" && !t.parentCurrency.isTestnetFor
  );
  expect(tokens.map((t) => t.id).sort()).toMatchSnapshot();
  expect(tokens.every((t) => t.disableCountervalue === false)).toBe(true);
});

test("can register a new coin externally", () => {
  const coinId = "mycoin";
  expect(() => getCryptoCurrencyById("mycoin")).toThrow(
    `currency with id "${coinId}" not found`
  );
  const mycoin = {
    type: "CryptoCurrency",
    id: coinId,
    coinType: 8008,
    name: "MyCoin",
    managerAppName: "MyCoin",
    ticker: "MYC",
    countervalueTicker: "MYC",
    scheme: "mycoin",
    color: "#ff0000",
    family: "mycoin",
    units: [
      {
        name: "MYC",
        code: "MYC",
        magnitude: 8,
      },
      {
        name: "SmallestUnit",
        code: "SMALLESTUNIT",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        address: "https://mycoinexplorer.com/account/$address",
        tx: "https://mycoinexplorer.com/transaction/$hash",
        token: "https://mycoinexplorer.com/token/$contractAddress/?a=$address",
      },
    ],
  };
  registerCryptoCurrency(coinId, mycoin as CryptoCurrency);
  expect(getCryptoCurrencyById(coinId)).toEqual(mycoin);
});
