//@flow
/**
 * ADDING A NEW COIN to the frontend stack:
 * You need to add the coin in cryptocurrenciesById
 *
 * ~~ fields ~~
 *
 * for id, we use by convention lowercased coin name with _ instead of space.
 * for coinType look at https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 * for ticker, check this is the one used in exchanges (BTW our countervalues api will only support the new coin until we do a redeployment to support it (whitelist))
 * scheme is generally the id
 * for color, check with us, this is usually picked by our design team.
 * for ledgerExplorerId, check with us, it is our internal explorer id (backend explorer team).
 * for blockAvgTime, check online & on explorers what's the average time between 2 blocks.
 * if it's a testnet coin, use isTestnetFor field. testnet MUST only be added if we actually support it at ledger (in our explorer api)
 * if the coin is in bitcoin family, please provide bitcoinLikeInfo field
 *
 * ~~ icon ~~
 *
 * there is a folder src/data/icons/svg/ that will contain all coin icons.
 * Either add one by respecting the other icons convention, or ask us and we will have our design team doing it.
 *
 * ~~ also ~~
 *
 * Once added here, you also need to update CryptoCurrencyConfig in `src/explorers.js`.
 * In addition, you will need to run `yarn test`.
 * If it doesn't pass you will need to update the snapshots with `TZ=America/New_York jest -u`.
 * If you don't have `jest` installed locally you can install it with `npm install -g jest`.
 *
 */

import type { CryptoCurrency, Unit } from "../types";

const makeTestnetUnit = u => ({
  ...u,
  code: `𝚝${u.code}`
});

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
    code: "sat",
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

const cryptocurrenciesById = {
  bitcoin: {
    id: "bitcoin",
    coinType: 0,
    name: "Bitcoin",
    managerAppName: "Bitcoin",
    ticker: "BTC",
    scheme: "bitcoin",
    color: "#ffae35",
    units: bitcoinUnits,
    supportsSegwit: true,
    family: "bitcoin",
    ledgerExplorerId: "btc",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 0,
      P2SH: 5
    }
  },
  ethereum: {
    id: "ethereum",
    coinType: 60,
    name: "Ethereum",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "ethereum",
    color: "#0ebdcd",
    units: ethereumUnits,
    family: "ethereum",
    ledgerExplorerId: "eth",
    blockAvgTime: 15
  },
  ripple: {
    id: "ripple",
    coinType: 144,
    name: "Ripple",
    managerAppName: "Ripple",
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
    ],
    family: "ripple"
  },
  bitcoin_cash: {
    id: "bitcoin_cash",
    coinType: 145,
    name: "Bitcoin Cash",
    managerAppName: "Bitcoin Cash",
    ticker: "BCH",
    scheme: "bitcoincash",
    color: "#3ca569",
    family: "bitcoin",
    ledgerExplorerId: "abc",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 0,
      P2SH: 5
    },
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
        code: "sat",
        symbol: "Ƀ",
        magnitude: 0
      }
    ]
  },
  litecoin: {
    id: "litecoin",
    coinType: 2,
    name: "Litecoin",
    managerAppName: "Litecoin",
    ticker: "LTC",
    scheme: "litecoin",
    color: "#cccccc",
    supportsSegwit: true,
    family: "bitcoin",
    ledgerExplorerId: "ltc",
    blockAvgTime: 5 * 60,
    bitcoinLikeInfo: {
      P2PKH: 48,
      P2SH: 50
    },
    units: [
      {
        name: "litecoin",
        code: "LTC",
        symbol: "Ł",
        magnitude: 8
      },
      {
        name: "mLTC",
        code: "mLTC",
        symbol: "Ł",
        magnitude: 5
      },
      {
        name: "litoshi",
        code: "litoshi",
        symbol: "Ł",
        magnitude: 0
      }
    ]
  },
  dash: {
    id: "dash",
    coinType: 5,
    name: "Dash",
    managerAppName: "Dash",
    ticker: "DASH",
    scheme: "dash",
    color: "#0e76aa",
    family: "bitcoin",
    ledgerExplorerId: "dash",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 76,
      P2SH: 16
    },
    units: [
      {
        name: "dash",
        code: "DASH",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  ethereum_classic: {
    id: "ethereum_classic",
    coinType: 61,
    name: "Ethereum Classic",
    managerAppName: "Ethereum", // It's the same Ethereum app
    ticker: "ETC",
    scheme: "ethereumclassic",
    color: "#3ca569",
    units: ethereumUnitsClassic,
    family: "ethereum",
    ledgerExplorerId: "ethc",
    blockAvgTime: 15
  },
  qtum: {
    id: "qtum",
    coinType: 88,
    name: "Qtum",
    managerAppName: "Qtum",
    ticker: "QTUM",
    scheme: "qtum",
    color: "#2e9ad0",
    family: "bitcoin",
    ledgerExplorerId: "qtum",
    blockAvgTime: 2 * 60,
    bitcoinLikeInfo: {
      P2PKH: 58,
      P2SH: 50
    },
    units: [
      {
        name: "qtum",
        code: "QTUM",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  zcash: {
    id: "zcash",
    coinType: 133,
    name: "Zcash",
    managerAppName: "Zcash",
    ticker: "ZEC",
    scheme: "zcash",
    color: "#3790ca",
    family: "bitcoin",
    ledgerExplorerId: "zec",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 0x1cb8,
      P2SH: 0x1cbd
    },
    units: [
      {
        name: "zcash",
        code: "ZEC",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  bitcoin_gold: {
    id: "bitcoin_gold",
    coinType: 156,
    name: "Bitcoin Gold",
    managerAppName: "Bitcoin Gold",
    ticker: "BTG",
    scheme: "btg",
    color: "#132c47",
    supportsSegwit: true,
    family: "bitcoin",
    ledgerExplorerId: "btg",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 38,
      P2SH: 23
    },
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
        code: "sat",
        symbol: "Ƀ",
        magnitude: 0
      }
    ]
  },
  stratis: {
    id: "stratis",
    coinType: 105,
    name: "Stratis",
    managerAppName: "Stratis",
    ticker: "STRAT",
    scheme: "stratis",
    color: "#1382c6",
    family: "bitcoin",
    ledgerExplorerId: "strat",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 63,
      P2SH: 125
    },
    units: [
      {
        name: "stratis",
        code: "STRAT",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  dogecoin: {
    id: "dogecoin",
    coinType: 3,
    name: "Dogecoin",
    managerAppName: "Dogecoin",
    ticker: "DOGE",
    scheme: "dogecoin",
    color: "#65d196",
    family: "bitcoin",
    ledgerExplorerId: "doge",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 30,
      P2SH: 22
    },
    units: [
      {
        name: "dogecoin",
        code: "DOGE",
        symbol: "Ð",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  digibyte: {
    id: "digibyte",
    coinType: 20,
    name: "Digibyte",
    managerAppName: "Digibyte",
    ticker: "DGB",
    scheme: "digibyte",
    color: "#0066cc",
    family: "bitcoin",
    ledgerExplorerId: "dgb",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 30,
      P2SH: 5
    },
    units: [
      {
        name: "digibyte",
        code: "DGB",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  hcash: {
    id: "hcash",
    coinType: 171,
    name: "Hcash",
    managerAppName: "HCash",
    ticker: "HSR",
    scheme: "hcash",
    color: "#56438c",
    family: "bitcoin",
    ledgerExplorerId: "hsr",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 40,
      P2SH: 100
    },
    units: [
      {
        name: "hcash",
        code: "HSR",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  komodo: {
    id: "komodo",
    coinType: 141,
    name: "Komodo",
    managerAppName: "Komodo",
    ticker: "KMD",
    scheme: "komodo",
    color: "#326464",
    family: "bitcoin",
    ledgerExplorerId: "kmd",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 60,
      P2SH: 85
    },
    units: [
      {
        name: "komodo",
        code: "KMD",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  pivx: {
    id: "pivx",
    coinType: 77,
    name: "PivX",
    managerAppName: "PIVX",
    ticker: "PIVX",
    scheme: "pivx",
    color: "#46385d",
    family: "bitcoin",
    ledgerExplorerId: "pivx",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 30,
      P2SH: 13
    },
    units: [
      {
        name: "pivx",
        code: "PIVX",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  zencash: {
    id: "zencash",
    coinType: 121,
    name: "ZenCash",
    managerAppName: "ZenCash",
    ticker: "ZEN",
    scheme: "zencash",
    color: "#152f5c",
    family: "bitcoin",
    ledgerExplorerId: "zen",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 0x2089,
      P2SH: 0x2096
    },
    units: [
      {
        name: "zencash",
        code: "ZEN",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  vertcoin: {
    id: "vertcoin",
    coinType: 28,
    name: "Vertcoin",
    managerAppName: "Vertcoin",
    ticker: "VTC",
    scheme: "vertcoin",
    color: "#1b5c2e",
    supportsSegwit: true,
    family: "bitcoin",
    ledgerExplorerId: "vtc",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 71,
      P2SH: 5
    },
    units: [
      {
        name: "vertcoin",
        code: "VTC",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  peercoin: {
    id: "peercoin",
    coinType: 6,
    name: "Peercoin",
    managerAppName: "Peercoin",
    ticker: "PPC",
    scheme: "peercoin",
    color: "#3cb054",
    family: "bitcoin",
    ledgerExplorerId: "ppc",
    blockAvgTime: 450,
    bitcoinLikeInfo: {
      P2PKH: 55,
      P2SH: 117
    },
    units: [
      {
        name: "peercoin",
        code: "PPC",
        magnitude: 6
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  viacoin: {
    id: "viacoin",
    coinType: 14,
    name: "Viacoin",
    managerAppName: "Viacoin",
    ticker: "VIA",
    scheme: "viacoin",
    color: "#414141",
    supportsSegwit: true,
    family: "bitcoin",
    ledgerExplorerId: "via",
    blockAvgTime: 24,
    bitcoinLikeInfo: {
      P2PKH: 71,
      P2SH: 33
    },
    units: [
      {
        name: "viacoin",
        code: "VIA",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  stealthcoin: {
    id: "stealthcoin",
    coinType: 125,
    name: "Stealth",
    managerAppName: "Stealthcoin",
    ticker: "XST",
    scheme: "stealth",
    color: "#000000",
    family: "bitcoin",
    ledgerExplorerId: "xst",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 62,
      P2SH: 85
    },
    units: [
      {
        name: "stealth",
        code: "XST",
        magnitude: 6
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  poswallet: {
    id: "poswallet",
    coinType: 47,
    name: "PosW",
    managerAppName: "PoSW",
    ticker: "POSW",
    scheme: "posw",
    color: "#000000", // FIXME
    family: "bitcoin",
    ledgerExplorerId: "posw",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 55,
      P2SH: 85
    },
    units: [
      {
        name: "posw",
        code: "POSW",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  clubcoin: {
    id: "clubcoin",
    coinType: 79,
    name: "Clubcoin",
    managerAppName: "Clubcoin",
    ticker: "CLUB",
    scheme: "club",
    color: "#000000", // FIXME
    family: "bitcoin",
    ledgerExplorerId: "club",
    blockAvgTime: 140,
    bitcoinLikeInfo: {
      P2PKH: 28,
      P2SH: 85
    },
    units: [
      {
        name: "club",
        code: "CLUB",
        magnitude: 8
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0
      }
    ]
  },
  ubiq: {
    id: "ubiq",
    coinType: 108,
    name: "Ubiq",
    managerAppName: "Ubiq",
    ticker: "UBQ",
    scheme: "ubiq",
    color: "#02e785",
    family: "ethereum",
    ledgerExplorerId: "ubq",
    blockAvgTime: 88,
    units: [
      {
        name: "ubiq",
        code: "UBQ",
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
    ]
  },

  // Testnets
  bitcoin_testnet: {
    id: "bitcoin_testnet",
    coinType: 1,
    name: "Bitcoin Testnet",
    managerAppName: "Bitcoin testnet",
    ticker: "BTC",
    scheme: "testnet",
    color: "#00ff00",
    units: bitcoinUnits.map(makeTestnetUnit),
    supportsSegwit: true,
    isTestnetFor: "bitcoin",
    family: "bitcoin",
    ledgerExplorerId: "testnet",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 111,
      P2SH: 196
    }
  },
  ethereum_testnet: {
    id: "ethereum_testnet",
    coinType: 1,
    name: "Ethereum Testnet",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "ethereum_testnet",
    color: "#00ff00",
    units: ethereumUnits.map(makeTestnetUnit),
    isTestnetFor: "ethereum",
    family: "ethereum",
    ledgerExplorerId: "eth_testnet",
    blockAvgTime: 15
  }
};

export type CryptoCurrencyObjMap<F> = $Exact<
  $ObjMap<typeof cryptocurrenciesById, F>
>;

export type CryptoCurrencyConfig<C> = CryptoCurrencyObjMap<(*) => C>;

export type CryptoCurrencyIds = $Keys<typeof cryptocurrenciesById>;

const cryptocurrenciesByScheme: { [_: string]: CryptoCurrency } = {};
const cryptocurrenciesByTicker: { [_: string]: CryptoCurrency } = {};
const cryptocurrenciesArray = [];
const prodCryptoArray = [];
for (let id in cryptocurrenciesById) {
  const c = cryptocurrenciesById[id];
  cryptocurrenciesById[c.id] = c;
  cryptocurrenciesByScheme[c.scheme] = c;
  cryptocurrenciesByTicker[c.ticker] = c;
  if (!c.isTestnetFor) {
    prodCryptoArray.push(c);
  }
  cryptocurrenciesArray.push(c);
}

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
