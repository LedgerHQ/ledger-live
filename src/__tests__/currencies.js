//@flow

import { BigNumber } from "bignumber.js";
import {
  sortByMarketcap,
  listTokens,
  listFiatCurrencies,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
  hasFiatCurrencyTicker,
  formatCurrencyUnit,
  parseCurrencyUnit,
  chopCurrencyUnitDecimals,
  formatShort,
  decodeURIScheme,
  encodeURIScheme,
  sanitizeValueString,
  findTokenByTicker
} from "../currencies";
import { byContractAddress } from "@ledgerhq/hw-app-eth/erc20";

import "../load/tokens/ethereum/erc20";
import "../load/tokens/tron/trc10";
import "../load/tokens/tron/trc20";

test("can get currency by coin type", () => {
  expect(getCryptoCurrencyById("bitcoin")).toMatchObject({
    id: "bitcoin",
    name: "Bitcoin"
  });
  expect(getCryptoCurrencyById("litecoin")).toMatchObject({
    id: "litecoin",
    name: "Litecoin"
  });
  expect(hasCryptoCurrencyId("bitcoin")).toBe(true);
  expect(hasCryptoCurrencyId("")).toBe(false);
  expect(() => getCryptoCurrencyById("")).toThrow();
  expect(hasCryptoCurrencyId("_")).toBe(false);
  expect(() => getCryptoCurrencyById("_")).toThrow();
});

test("there are some dev cryptocurrencies", () => {
  const all = listCryptoCurrencies(true);
  const prod = listCryptoCurrencies();
  expect(listCryptoCurrencies(false)).toBe(listCryptoCurrencies());
  expect(all).not.toBe(prod);
  expect(all.filter(a => !a.isTestnetFor)).toMatchObject(prod);
  expect(all.length).toBeGreaterThan(prod.length);
});

test("all cryptocurrencies match (by reference) the one you get by id", () => {
  for (let c of listCryptoCurrencies()) {
    expect(c).toBe(getCryptoCurrencyById(c.id));
  }
});

test("there is no testnet or terminated coin by default", () => {
  for (let c of listCryptoCurrencies()) {
    expect(!c.terminated).toBe(true);
    expect(!c.isTestnetFor).toBe(true);
  }
});

test("all cryptocurrencies have at least one unit", () => {
  for (let c of listCryptoCurrencies()) {
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

test("erc20 are all consistent with those on ledgerjs side", () => {
  const normalList = listTokens();
  const delistedList = listTokens({ withDelisted: true });
  expect(delistedList.length).toBeGreaterThan(normalList.length);
  for (const token of delistedList) {
    if (token.delisted) {
      expect(normalList.find(o => o.id === token.id)).toBeUndefined();
    }
    if (token.tokenType === "erc20") {
      const tokenData = byContractAddress(token.contractAddress);
      if (!tokenData) {
        throw new Error(token.name + " not available in ledgerjs data");
      }
      expect(token.ticker.toLowerCase()).toBe(tokenData.ticker.toLowerCase());
      expect(token.contractAddress.toLowerCase()).toBe(
        tokenData.contractAddress.toLowerCase()
      );
      expect(token.units[0].magnitude).toBe(tokenData.decimals);
    }
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
  }
});

test("disable token have less priority when ticker collision (SUB token case)", () => {
  expect(listTokens().filter(t => t.ticker === "SUB")).toMatchObject([
    { id: "ethereum/erc20/substratum", disableCountervalue: true },
    { id: "ethereum/erc20/substratum_", disableCountervalue: false }
  ]);
  expect(findTokenByTicker("SUB")).toMatchObject({
    id: "ethereum/erc20/substratum_"
  });
});

test("fiats list is sorted by ticker", () => {
  expect(
    listFiatCurrencies()
      .map(fiat => fiat.ticker)
      .join(",")
  ).toEqual(
    listFiatCurrencies()
      .map(fiat => fiat.ticker)
      .sort((a, b) => (a > b ? 1 : -1))
      .join(",")
  );
});

test("sort by marketcap", () => {
  const tokens = listTokens().filter(
    t => t.ticker === "XST" || t.ticker === "ZRX" || t.ticker === "HOT"
  );
  const currencies = listCryptoCurrencies().filter(
    c => c.ticker === "BTC" || c.ticker === "XST" || c.ticker === "ETH"
  );
  expect(
    sortByMarketcap(currencies.concat(tokens), [
      "BTC",
      "ETH",
      "ZRX",
      "HOT",
      "XST"
    ]).map(c => c.id)
  ).toMatchObject([
    "bitcoin",
    "ethereum",
    "ethereum/erc20/0x_project",
    "stealthcoin",
    "ethereum/erc20/holotoken",
    "ethereum/erc20/hydro_protocol",
    "ethereum/erc20/xensor"
  ]);
});

test("can get fiat by coin type", () => {
  expect(getFiatCurrencyByTicker("USD").units[0]).toMatchObject({
    magnitude: 2
  });
  expect(getFiatCurrencyByTicker("EUR").units[0]).toMatchObject({
    magnitude: 2
  });
  // this is not a fiat \o/
  expect(() => getFiatCurrencyByTicker("USDT").units[0]).toThrow();
  expect(hasFiatCurrencyTicker("USD")).toBe(true);
  expect(hasFiatCurrencyTicker("USDT")).toBe(false);
});

test("can format a currency unit", () => {
  const btc = getCryptoCurrencyById("bitcoin").units[0];
  expect(formatCurrencyUnit(btc, BigNumber(100000000))).toBe("1");
  expect(
    formatCurrencyUnit(btc, BigNumber(1000000), {
      showCode: true
    })
  ).toBe("BTC 0.01");
  expect(
    formatCurrencyUnit(btc, BigNumber(100000000), {
      showCode: true
    })
  ).toBe("BTC 1");
  expect(
    formatCurrencyUnit(btc, BigNumber(100000000), {
      showCode: true,
      showAllDigits: true
    })
  ).toBe("BTC 1.00000000");
  expect(
    formatCurrencyUnit(btc, BigNumber(100000000), {
      showCode: true,
      showAllDigits: true,
      alwaysShowSign: true
    })
  ).toBe("+ BTC 1.00000000");
});

test("can enable discreet mode", () => {
  const btc = getCryptoCurrencyById("bitcoin").units[0];
  expect(
    formatCurrencyUnit(btc, BigNumber(100000000), { discreet: true })
  ).toBe("***");
  expect(
    formatCurrencyUnit(btc, BigNumber(1000000), {
      discreet: true,
      showCode: true
    })
  ).toBe("BTC ***");
  expect(
    formatCurrencyUnit(btc, BigNumber(100000000), {
      discreet: true,
      showCode: true
    })
  ).toBe("BTC ***");
  expect(
    formatCurrencyUnit(btc, BigNumber(100000000), {
      discreet: true,
      showCode: true,
      showAllDigits: true
    })
  ).toBe("BTC ***");
  expect(
    formatCurrencyUnit(btc, BigNumber(100000000), {
      discreet: true,
      showCode: true,
      showAllDigits: true,
      alwaysShowSign: true
    })
  ).toBe("+ BTC ***");
});

test("formatter will round values by default", () => {
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      BigNumber(1000001),
      {}
    )
  ).toBe("0.01");
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      BigNumber(1000010)
    )
  ).toBe("0.01");
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      BigNumber(1000100)
    )
  ).toBe("0.010001");
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      BigNumber("999999999999")
    )
  ).toBe("10,000");
});

test("formatter rounding can be disabled", () => {
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      BigNumber("999999999999"),
      {
        disableRounding: true
      }
    )
  ).toBe("9,999.99999999");
});

test("sub magnitude", () => {
  expect(
    formatCurrencyUnit(
      getFiatCurrencyByTicker("USD").units[0],
      BigNumber(0.04),
      {
        subMagnitude: 2
      }
    )
  ).toBe("0.0004");

  // digits will be round after subMagnitude
  expect(
    formatCurrencyUnit(
      getFiatCurrencyByTicker("USD").units[0],
      BigNumber(0.03987654),
      {
        subMagnitude: 2,
        showCode: true
      }
    )
  ).toBe("USD 0.0004");

  expect(
    formatCurrencyUnit(
      getFiatCurrencyByTicker("USD").units[0],
      BigNumber(0.03987654),
      {
        subMagnitude: 2,
        disableRounding: true
      }
    )
  ).toBe("0.0004");

  expect(
    formatCurrencyUnit(
      getFiatCurrencyByTicker("USD").units[0],
      BigNumber(0.03987654),
      {
        subMagnitude: 5,
        disableRounding: true
      }
    )
  ).toBe("0.0003988");

  // even tho the USD unit showAllDigits, it does not force the sub magnitude digits to show
  expect(
    formatCurrencyUnit(
      getFiatCurrencyByTicker("USD").units[0],
      BigNumber(0.03),
      {
        subMagnitude: 5,
        disableRounding: true
      }
    )
  ).toBe("0.0003");

  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      BigNumber(9.123456),
      {
        subMagnitude: 2,
        disableRounding: true
      }
    )
  ).toBe("0.0000000912");
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      BigNumber("999999999999.123456"),
      {
        disableRounding: true,
        subMagnitude: 2
      }
    )
  ).toBe("9,999.9999999912");
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      BigNumber("999999999999.123456"),
      {
        subMagnitude: 2
      }
    )
  ).toBe("10,000");
});

test("parseCurrencyUnit", () => {
  expect(
    parseCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      "9999.99999999"
    ).toNumber()
  ).toBe(999999999999);
  expect(
    parseCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      ".987654"
    ).toNumber()
  ).toBe(98765400);
  expect(
    parseCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      "9999"
    ).toNumber()
  ).toBe(999900000000);
  expect(
    parseCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], "1").toNumber()
  ).toBe(100000000);
  /*expect(
    parseCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], "0x1").toNumber()
  ).toBe(0);*/
  expect(
    parseCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      "NOPE"
    ).toNumber()
  ).toBe(0);
});

test("formatter works with fiats", () => {
  expect(
    formatCurrencyUnit(
      getFiatCurrencyByTicker("EUR").units[0],
      BigNumber(12345),
      {
        showCode: true
      }
    )
  ).toBe("EUR 123.45");
  // by default, fiats always show the digits
  expect(
    formatCurrencyUnit(
      getFiatCurrencyByTicker("EUR").units[0],
      BigNumber(12300)
    )
  ).toBe("123.00");
});

test("formatter useGrouping", () => {
  expect(
    formatCurrencyUnit(
      getFiatCurrencyByTicker("EUR").units[0],
      BigNumber(1234500),
      {
        useGrouping: true
      }
    )
  ).toBe("12,345.00");
  expect(
    formatCurrencyUnit(
      getFiatCurrencyByTicker("EUR").units[0],
      BigNumber(1234500),
      {
        useGrouping: false
      }
    )
  ).toBe("12345.00");
});

test("formatter can change locale", () => {
  expect(
    formatCurrencyUnit(
      getFiatCurrencyByTicker("USD").units[0],
      BigNumber(-1234567),
      {
        showCode: true
      }
    )
  ).toBe("- USD 12,345.67");
});

test("formatter does not show very small value in rounding mode", () => {
  expect(
    formatCurrencyUnit(getCryptoCurrencyById("ethereum").units[0], BigNumber(1))
  ).toBe("0");
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("ethereum").units[0],
      BigNumber(1000)
    )
  ).toBe("0");
});

test("formatShort", () => {
  expect(
    formatShort(getFiatCurrencyByTicker("EUR").units[0], BigNumber(123456789))
  ).toBe("1.2m");
  expect(
    formatShort(getFiatCurrencyByTicker("EUR").units[0], BigNumber(123456))
  ).toBe("1.2k");

  expect(
    formatShort(getCryptoCurrencyById("ethereum").units[0], BigNumber(600000))
  ).toBe("0");
});

test("chopCurrencyUnitDecimals", () => {
  expect(
    chopCurrencyUnitDecimals(getFiatCurrencyByTicker("EUR").units[0], "1")
  ).toBe("1");
  expect(
    chopCurrencyUnitDecimals(getFiatCurrencyByTicker("EUR").units[0], "1234")
  ).toBe("1234");
  expect(
    chopCurrencyUnitDecimals(getFiatCurrencyByTicker("EUR").units[0], "1234.56")
  ).toBe("1234.56");
  expect(
    chopCurrencyUnitDecimals(
      getFiatCurrencyByTicker("EUR").units[0],
      "1234.5678"
    )
  ).toBe("1234.56");
  expect(
    chopCurrencyUnitDecimals(
      getFiatCurrencyByTicker("EUR").units[0],
      "1234.5678 EUR"
    )
  ).toBe("1234.56 EUR");
});

test("encodeURIScheme", () => {
  expect(
    encodeURIScheme({
      currency: getCryptoCurrencyById("bitcoin"),
      address: "1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV"
    })
  ).toBe("bitcoin:1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV");

  expect(
    encodeURIScheme({
      currency: getCryptoCurrencyById("bitcoin"),
      address: "1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV",
      amount: BigNumber("1234567000000")
    })
  ).toBe("bitcoin:1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV?amount=12345.67");
});

test("decodeURIScheme", () => {
  expect(
    decodeURIScheme("bitcoin:1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV")
  ).toMatchObject({
    currency: getCryptoCurrencyById("bitcoin"),
    address: "1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV"
  });

  expect(
    decodeURIScheme("bitcoin:1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV?amount=12345.67")
  ).toMatchObject({
    currency: getCryptoCurrencyById("bitcoin"),
    address: "1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV",
    amount: BigNumber("1234567000000")
  });
});

test("sanitizeValueString", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const btcUnit = bitcoin.units[0];
  const satUnit = bitcoin.units[bitcoin.units.length - 1];
  expect(sanitizeValueString(btcUnit, "")).toMatchObject({
    display: ""
  });
  expect(sanitizeValueString(btcUnit, "123456")).toMatchObject({
    display: "123456",
    value: "12345600000000"
  });
  expect(sanitizeValueString(btcUnit, "1")).toMatchObject({
    display: "1",
    value: "100000000"
  });
  expect(sanitizeValueString(btcUnit, "1.00")).toMatchObject({
    display: "1.00",
    value: "100000000"
  });
  expect(sanitizeValueString(btcUnit, ".00")).toMatchObject({
    display: "0.00"
  });
  expect(sanitizeValueString(btcUnit, ".1")).toMatchObject({
    display: "0.1"
  });
  expect(sanitizeValueString(btcUnit, ".123456789")).toMatchObject({
    display: "0.12345678"
  });
  expect(sanitizeValueString(btcUnit, "1ab")).toMatchObject({
    display: "1"
  });
  expect(sanitizeValueString(btcUnit, "1,3")).toMatchObject({
    display: "1.3"
  });
  expect(sanitizeValueString(btcUnit, "1 300")).toMatchObject({
    display: "1300"
  });
  expect(sanitizeValueString(btcUnit, "13.")).toMatchObject({
    display: "13.",
    value: "1300000000"
  });
  expect(sanitizeValueString(satUnit, "13.")).toMatchObject({
    display: "13",
    value: "13"
  });
  expect(sanitizeValueString(btcUnit, "000.12345678")).toMatchObject({
    display: "0.12345678",
    value: "12345678"
  });
  expect(sanitizeValueString(btcUnit, "001.23456789")).toMatchObject({
    display: "1.23456789",
    value: "123456789"
  });
});
