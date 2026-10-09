import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "../types";
import { decodeURIScheme, encodeURIScheme } from "./CurrencyURIScheme";
import { type CurrenciesResolver, setCurrenciesResolver } from "./resolver";

const bitcoin = {
  id: "bitcoin",
  scheme: "bitcoin",
  units: [{ name: "bitcoin", code: "BTC", magnitude: 8 }],
} as unknown as CryptoCurrency;

const ethereum = {
  id: "ethereum",
  scheme: "ethereum",
  units: [{ name: "ether", code: "ETH", magnitude: 18 }],
} as unknown as CryptoCurrency;

const BTC_ADDRESS = "1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV";
const ETH_ADDRESS = "0x931d387731bbbc988b312206c74f77d004d6b84b";

type EncodeInput = Parameters<typeof encodeURIScheme>[0];

beforeAll(() => {
  setCurrenciesResolver({
    findCryptoCurrencyByScheme: scheme => [bitcoin, ethereum].find(c => c.scheme === scheme),
  } as CurrenciesResolver);
});

describe("encodeURIScheme", () => {
  it("returns the bare address without a currency", () => {
    expect(encodeURIScheme({ address: BTC_ADDRESS, amount: new BigNumber(1) })).toBe(BTC_ADDRESS);
  });

  it("omits the query when there is nothing to encode", () => {
    expect(encodeURIScheme({ currency: bitcoin, address: BTC_ADDRESS })).toBe(
      `bitcoin:${BTC_ADDRESS}`,
    );
  });

  it("encodes the amount in the main unit", () => {
    expect(
      encodeURIScheme({
        currency: bitcoin,
        address: BTC_ADDRESS,
        amount: new BigNumber("1234567000000"),
      }),
    ).toBe(`bitcoin:${BTC_ADDRESS}?amount=12345.67`);
    expect(
      encodeURIScheme({ currency: bitcoin, address: BTC_ADDRESS, amount: new BigNumber(1) }),
    ).toBe(`bitcoin:${BTC_ADDRESS}?amount=1e-8`);
  });

  it("encodes spaces as %20 and leaves !'()*~ unescaped", () => {
    expect(
      encodeURIScheme({
        currency: bitcoin,
        address: BTC_ADDRESS,
        label: "Ledger Live",
        message: "a!b'c(d)e*f~g&h=i",
      } as EncodeInput),
    ).toBe(`bitcoin:${BTC_ADDRESS}?label=Ledger%20Live&message=a!b'c(d)e*f~g%26h%3Di`);
  });

  it("encodes BigNumber fields as an empty value", () => {
    expect(
      encodeURIScheme({
        currency: ethereum,
        address: ETH_ADDRESS,
        gasPrice: new BigNumber(200),
      }),
    ).toBe(`ethereum:${ETH_ADDRESS}?gasPrice=`);
  });

  it("keeps field order and puts the amount last", () => {
    expect(
      encodeURIScheme({
        currency: bitcoin,
        address: BTC_ADDRESS,
        amount: new BigNumber(100000000),
        label: "x",
        count: 2,
        flag: true,
      } as EncodeInput),
    ).toBe(`bitcoin:${BTC_ADDRESS}?label=x&count=2&flag=true&amount=1`);
  });
});

describe("decodeURIScheme", () => {
  it("decodes + and %20 as a space", () => {
    expect(decodeURIScheme(`bitcoin:${BTC_ADDRESS}?label=Ledger+Live&message=a%20b`)).toEqual({
      currency: bitcoin,
      address: BTC_ADDRESS,
      label: "Ledger Live",
      message: "a b",
    });
  });

  it("decodes repeated keys as an array", () => {
    expect(decodeURIScheme(`bitcoin:${BTC_ADDRESS}?label=a&label=b`)).toEqual({
      currency: bitcoin,
      address: BTC_ADDRESS,
      label: ["a", "b"],
    });
  });

  it("decodes a key without a value as an empty string", () => {
    expect(decodeURIScheme(`bitcoin:${BTC_ADDRESS}?label`)).toEqual({
      currency: bitcoin,
      address: BTC_ADDRESS,
      label: "",
    });
  });

  it("converts the amount to the smallest unit", () => {
    expect(decodeURIScheme(`bitcoin:${BTC_ADDRESS}?amount=12345.67`)).toEqual({
      currency: bitcoin,
      address: BTC_ADDRESS,
      amount: new BigNumber("1234567000000"),
    });
  });

  it("maps ethereum value, gas and gasPrice and clamps negatives to 0", () => {
    expect(decodeURIScheme(`ethereum:${ETH_ADDRESS}?value=1000&gas=21000&gasPrice=200`)).toEqual({
      currency: ethereum,
      address: ETH_ADDRESS,
      amount: new BigNumber(1000),
      userGasLimit: new BigNumber(21000),
      gasPrice: new BigNumber(200),
    });
    expect(decodeURIScheme(`ethereum:${ETH_ADDRESS}?value=-1&gas=-1&gasPrice=-1`)).toEqual({
      currency: ethereum,
      address: ETH_ADDRESS,
      amount: new BigNumber(0),
      userGasLimit: new BigNumber(0),
      gasPrice: new BigNumber(0),
    });
  });

  it("returns only the address for an unknown or missing scheme", () => {
    expect(decodeURIScheme(`dogecoin:${BTC_ADDRESS}?amount=1`)).toEqual({ address: BTC_ADDRESS });
    expect(decodeURIScheme(`${BTC_ADDRESS}?amount=1`)).toEqual({ address: BTC_ADDRESS });
  });

  it("does not read a canton address as a scheme", () => {
    const address = "ldg::1220691e945dc1b210f3b6be9fbad73efaf642bfb96022552f66c9e2b83b00cb20e8";
    expect(decodeURIScheme(address)).toEqual({ address });
  });
});
