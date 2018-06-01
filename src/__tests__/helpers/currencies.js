//@flow

import {
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
  encodeURIScheme
} from "../../helpers/currencies";

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
    expect(unit.symbol).toBeTruthy();
    expect(typeof unit.symbol).toBe("string");
    expect(unit.magnitude).toBeGreaterThan(-1);
    expect(typeof unit.magnitude).toBe("number");
    tickers[fiat.ticker] = unit;
  }
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

test("can get fiat by coin type", () => {
  expect(getFiatCurrencyByTicker("USD").units[0]).toMatchObject({
    symbol: "$",
    magnitude: 2
  });
  expect(getFiatCurrencyByTicker("EUR").units[0]).toMatchObject({
    symbol: "€",
    magnitude: 2
  });
  // this is not a fiat \o/
  expect(() => getFiatCurrencyByTicker("USDT").units[0]).toThrow();
  expect(hasFiatCurrencyTicker("USD")).toBe(true);
  expect(hasFiatCurrencyTicker("USDT")).toBe(false);
});

test("can format a currency unit", () => {
  expect(
    formatCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], 100000000)
  ).toBe("1");
  expect(
    formatCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], 1000000, {
      showCode: true
    })
  ).toBe("BTC 0.01");
  expect(
    formatCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], 100000000, {
      showCode: true
    })
  ).toBe("BTC 1");
  expect(
    formatCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], 100000000, {
      showCode: true,
      showAllDigits: true
    })
  ).toBe("BTC 1.00000000");
  expect(
    formatCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], 100000000, {
      showCode: true,
      showAllDigits: true,
      alwaysShowSign: true
    })
  ).toBe("+ BTC 1.00000000");
});

test("formatter will round values by default", () => {
  expect(
    formatCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], 1000001, {})
  ).toBe("0.01");
  expect(
    formatCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], 1000010)
  ).toBe("0.01");
  expect(
    formatCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], 1000100)
  ).toBe("0.010001");
  expect(
    formatCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], 999999999999)
  ).toBe("10,000");
});

test("formatter rounding can be disabled", () => {
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      999999999999,
      {
        disableRounding: true
      }
    )
  ).toBe("9,999.99999999");
});

test("sub magnitude", () => {
  expect(
    formatCurrencyUnit(getFiatCurrencyByTicker("USD").units[0], 0.04, {
      subMagnitude: 2
    })
  ).toBe("0.0004");

  // digits will be round after subMagnitude
  expect(
    formatCurrencyUnit(getFiatCurrencyByTicker("USD").units[0], 0.03987654, {
      subMagnitude: 2,
      showCode: true
    })
  ).toBe("USD 0.0004");

  expect(
    formatCurrencyUnit(getFiatCurrencyByTicker("USD").units[0], 0.03987654, {
      subMagnitude: 2,
      disableRounding: true
    })
  ).toBe("0.0004");

  expect(
    formatCurrencyUnit(getFiatCurrencyByTicker("USD").units[0], 0.03987654, {
      subMagnitude: 5,
      disableRounding: true
    })
  ).toBe("0.0003988");

  // even tho the USD unit showAllDigits, it does not force the sub magnitude digits to show
  expect(
    formatCurrencyUnit(getFiatCurrencyByTicker("USD").units[0], 0.03, {
      subMagnitude: 5,
      disableRounding: true
    })
  ).toBe("0.0003");

  expect(
    formatCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], 9.123456, {
      subMagnitude: 2
    })
  ).toBe("0.0000000912");
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      999999999999.123456,
      {
        disableRounding: true,
        subMagnitude: 2
      }
    )
  ).toBe("9,999.9999999912");
  expect(
    formatCurrencyUnit(
      getCryptoCurrencyById("bitcoin").units[0],
      999999999999.123456,
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
    )
  ).toBe(999999999999);
  expect(
    parseCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], ".987654")
  ).toBe(98765400);
  expect(
    parseCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], "9999")
  ).toBe(999900000000);
  expect(
    parseCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], "1")
  ).toBe(100000000);
  expect(
    parseCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], "0x1")
  ).toBe(0);
  expect(
    parseCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], "NOPE")
  ).toBe(0);
});

test("formatter works with fiats", () => {
  expect(
    formatCurrencyUnit(getFiatCurrencyByTicker("EUR").units[0], 12345, {
      showCode: true
    })
  ).toBe("EUR 123.45");
  // by default, fiats always show the digits
  expect(
    formatCurrencyUnit(getFiatCurrencyByTicker("EUR").units[0], 12300)
  ).toBe("123.00");
});

test("formatter useGrouping", () => {
  expect(
    formatCurrencyUnit(getFiatCurrencyByTicker("EUR").units[0], 1234500, {
      useGrouping: true
    })
  ).toBe("12,345.00");
  expect(
    formatCurrencyUnit(getFiatCurrencyByTicker("EUR").units[0], 1234500, {
      useGrouping: false
    })
  ).toBe("12345.00");
});

test("formatter can change locale", () => {
  expect(
    formatCurrencyUnit(getFiatCurrencyByTicker("USD").units[0], -1234567, {
      showCode: true
    })
  ).toBe("- USD 12,345.67");
});

test("formatShort", () => {
  expect(formatShort(getFiatCurrencyByTicker("EUR").units[0], 123456789)).toBe(
    "1.2m"
  );
  expect(formatShort(getFiatCurrencyByTicker("EUR").units[0], 123456)).toBe(
    "1.2k"
  );

  expect(formatShort(getCryptoCurrencyById("ethereum").units[0], 600000)).toBe(
    "0.0000000000006"
  );
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
      amount: 1234567000000
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
    amount: 1234567000000
  });
});
