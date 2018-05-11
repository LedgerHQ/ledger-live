//@flow
import type { CryptoCurrency, Unit } from "../types";

const bitcoinUnits: Unit[] = [
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
    name: "bit",
    code: "bit",
    symbol: "Ƀ",
    magnitude: 2
  },
  {
    name: "satoshi",
    code: "satoshi",
    symbol: "Ƀ",
    magnitude: 0
  }
];

const ethereumUnits = [
  {
    name: "ether",
    code: "ETH",
    symbol: "Ξ",
    magnitude: 18
  },
  {
    name: "Gwei",
    code: "Gwei",
    symbol: "Ξ",
    magnitude: 9
  },
  {
    name: "Mwei",
    code: "Mwei",
    symbol: "Ξ",
    magnitude: 6
  },
  {
    name: "Kwei",
    code: "Kwei",
    symbol: "Ξ",
    magnitude: 3
  },
  {
    name: "wei",
    code: "wei",
    symbol: "Ξ",
    magnitude: 0
  }
];

const ethereumUnitsClassic = [
  {
    name: "ETC",
    code: "ETC",
    symbol: "Ξ",
    magnitude: 18
  }
];

const cryptocurrenciesArray: CryptoCurrency[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    ticker: "BTC",
    scheme: "bitcoin",
    color: "#ffae35",
    units: bitcoinUnits
  },
  {
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    scheme: "ethereum",
    color: "#ffae35",
    units: ethereumUnits
  },
  {
    id: "ethereum_classic",
    name: "Ethereum Classic",
    ticker: "ETC",
    scheme: "ethereumclassic",
    color: "#3ca569",
    units: ethereumUnitsClassic
  },
  {
    id: "bitcoin_cash",
    name: "Bitcoin Cash",
    ticker: "BCH",
    scheme: "bch",
    color: "#85bb65",
    units: [
      {
        name: "bitcoin cash",
        code: "BCH",
        symbol: "Ƀ",
        magnitude: 8
      },
      {
        name: "mBCH",
        code: "mBCH",
        symbol: "Ƀ",
        magnitude: 5
      },
      {
        name: "bit",
        code: "bit",
        symbol: "Ƀ",
        magnitude: 2
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
    id: "bitcoin_gold",
    name: "Bitcoin Gold",
    ticker: "BTG",
    scheme: "btg",
    color: "#132c47",
    units: [
      {
        name: "bitcoin gold",
        code: "BTG",
        symbol: "Ƀ",
        magnitude: 8
      },
      {
        name: "mBTG",
        code: "mBTG",
        symbol: "Ƀ",
        magnitude: 5
      },
      {
        name: "bit",
        code: "bit",
        symbol: "Ƀ",
        magnitude: 2
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
    id: "litecoin",
    name: "Litecoin",
    ticker: "LTC",
    scheme: "litecoin",
    color: "#cccccc",
    units: [
      {
        name: "litecoin",
        code: "LTC",
        symbol: "Ł",
        magnitude: 8
      }
    ]
  },
  {
    id: "ripple",
    name: "Ripple",
    ticker: "XRP",
    scheme: "ripple",
    color: "#27a2db",
    units: [
      {
        name: "XRP",
        code: "XRP",
        symbol: "XRP",
        magnitude: 6
      },
      {
        name: "drop",
        code: "drop",
        symbol: "drop",
        magnitude: 0
      }
    ]
  },
  {
    id: "dogecoin",
    name: "Dogecoin",
    ticker: "DOGE",
    scheme: "dogecoin",
    color: "#65d196",
    units: [
      {
        name: "dogecoin",
        code: "DOGE",
        symbol: "Ð",
        magnitude: 8
      }
    ]
  },
  {
    id: "dash",
    name: "Dash",
    ticker: "DASH",
    scheme: "dash",
    color: "#0e76aa",
    units: [
      {
        name: "dash",
        code: "DASH",
        magnitude: 8
      }
    ]
  },
  {
    id: "peercoin",
    name: "Peercoin",
    ticker: "PPC",
    scheme: "peercoin",
    color: "#3cb054",
    units: [
      {
        name: "peercoin",
        code: "PPC",
        magnitude: 6
      }
    ]
  },
  {
    id: "stratis",
    name: "Stratis",
    ticker: "STRAT",
    scheme: "stratis",
    color: "#1382c6",
    units: [
      {
        name: "stratis",
        code: "STRAT",
        magnitude: 8
      }
    ]
  },
  {
    id: "zcash",
    name: "Zcash",
    ticker: "ZEC",
    scheme: "zcash",
    color: "#3790ca",
    units: [
      {
        name: "zcash",
        code: "ZEC",
        magnitude: 8
      }
    ]
  },
  {
    id: "komodo",
    name: "Komodo",
    ticker: "KMD",
    scheme: "komodo",
    color: "#326464",
    units: [
      {
        name: "komodo",
        code: "KMD",
        magnitude: 8
      }
    ]
  },
  {
    id: "ethereum_testnet",
    name: "Ethereum Testnet",
    ticker: "ETH",
    scheme: "ethereum",
    color: "#ffae35",
    units: ethereumUnits,
    isTestnetFor: "ethereum"
  },
  {
    id: "bitcoin_testnet",
    name: "Bitcoin Testnet",
    ticker: "BTC",
    scheme: "testnet",
    color: "#ffae35",
    units: bitcoinUnits,
    isTestnetFor: "bitcoin"
  }
];

const cryptocurrenciesById: { [_: string]: CryptoCurrency } = {};
const cryptocurrenciesByScheme: { [_: string]: CryptoCurrency } = {};
const cryptocurrenciesByTicker: { [_: string]: CryptoCurrency } = {};
const prodCryptoArray = [];
cryptocurrenciesArray.forEach(c => {
  cryptocurrenciesById[c.id] = c;
  cryptocurrenciesByScheme[c.scheme] = c;
  cryptocurrenciesByTicker[c.ticker] = c;
  if (!c.isTestnetFor) {
    prodCryptoArray.push(c);
  }
});

export function listCryptoCurrencies(
  withDevCrypto: boolean = false
): CryptoCurrency[] {
  return withDevCrypto ? cryptocurrenciesArray : prodCryptoArray;
}

export function findCryptoCurrencyByScheme(scheme: string): ?CryptoCurrency {
  return cryptocurrenciesByScheme[scheme];
}

export function findCryptoCurrencyByTicker(ticker: string): ?CryptoCurrency {
  return cryptocurrenciesByTicker[ticker];
}

export function findCryptoCurrencyById(id: string): ?CryptoCurrency {
  return cryptocurrenciesById[id];
}

export const hasCryptoCurrencyId = (id: string): boolean =>
  id in cryptocurrenciesById;

export function getCryptoCurrencyById(id: string): CryptoCurrency {
  const currency = findCryptoCurrencyById(id);
  if (!currency) {
    throw new Error(`currency with id "${id}" not found`);
  }
  return currency;
}
