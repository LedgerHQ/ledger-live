//@flow
import type { CurrencyEntity } from "./types";

const mockCurrencies: CurrencyEntity[] = [
  {
    name: "bitcoin",
    family: "Bitcoin",
    color: "#fcb653",
    units: [
      {
        name: "bitcoin",
        code: "BTC",
        symbol: "Ƀ",
        magnitude: 8
      },
      {
        name: "mBTC",
        code: "mBTC",
        symbol: "Ƀ",
        magnitude: 5
      },
      {
        name: "satoshi",
        code: "satoshi",
        symbol: "Ƀ",
        magnitude: 0
      }
    ]
  },
  {
    name: "dogecoin",
    family: "Dogecoin",
    color: "#65d196",
    units: [
      {
        name: "dogecoin",
        code: "DOGE",
        symbol: "DOGE",
        magnitude: 8
      }
    ]
  },
  {
    name: "dash",
    family: "Dash",
    color: "#0e76aa",
    units: [
      {
        name: "dash",
        code: "DASH",
        symbol: "DASH",
        magnitude: 8
      }
    ]
  },
  {
    name: "ethereum",
    family: "Ethereum",
    color: "#27d0e2",
    units: [
      {
        name: "ethereum",
        code: "ETH",
        symbol: "ETH",
        magnitude: 8
      }
    ]
  },
  {
    name: "ethereum-classic",
    family: "Ethereum",
    color: "#3ca569",
    units: [
      {
        name: "Ethereum Classic",
        code: "ETH",
        symbol: "ETH",
        magnitude: 8
      }
    ]
  },
  {
    name: "litecoin",
    family: "Litecoin",
    color: "#cccccc",
    units: [
      {
        name: "Litecoin",
        code: "LTC",
        symbol: "LTC",
        magnitude: 8
      }
    ]
  }
];

const currencies: { [_: string]: CurrencyEntity } = {};
mockCurrencies.forEach(c => {
  currencies[c.name] = c;
});

export default {
  currencies
};
