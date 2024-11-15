/*
 * ~~ fields ~~
 *
 * id: use by convention lowercased coin name with _ instead of space. if a coin get later rename, we NEVER rename the id for backward compatibility.
 * coinType: use https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 * family: group multiple coins together. For instance the "bitcoin" family includes bitcoin and all its derivated altcoins.
 * ticker: check this is the one used in exchanges (BTW our countervalues api will only support the new coin until we do a redeployment to support it (whitelist))
 * scheme is generally the id
 * color: is the dominant color of the currency logo, we will color the logo svg with it.
 * managerAppName: if any, is the exact name of the related Ledger's app in LL Manager.
 * blockAvgTime: the average time between 2 blocks, in seconds. (check online / on explorers)
 * scheme: the well accepted unique id to use in uri scheme (e.g. bitcoin:...)
 * units: specify the coin different units. There MUST be at least one. convention: it is desc ordered by magnitude, the last unit is the most divisible unit (e.g. satoshi)
 * terminated: Present when we no longer support this specific coin.
 * Specific cases:
 *
 * if it's a testnet coin, use isTestnetFor field. testnet MUST only be added if we actually support it at ledger (in our explorer api)
 * if the coin is a fork of another coin and it must support the "split", add forkedFrom info.
 * if the coin is in bitcoin family, please provide bitcoinLikeInfo field
 * if the coin is in ethereum family, you must as well provide ethereumLikeInfo
 * if bitcoin family, supportsSegwit defines if it supports segwit.
 */

import { CoinType, CryptoCurrency, CryptoCurrencyId, Unit } from "@ledgerhq/types-cryptoassets";

const makeTestnetUnit = u => ({ ...u, code: `𝚝${u.code}` });

const bitcoinUnits: Unit[] = [
  {
    name: "bitcoin",
    code: "BTC",
    magnitude: 8,
  },
  {
    name: "mBTC",
    code: "mBTC",
    magnitude: 5,
  },
  {
    name: "bit",
    code: "bit",
    magnitude: 2,
  },
  {
    name: "satoshi",
    code: "sat",
    magnitude: 0,
  },
];

const ethereumUnits = (name, code) => [
  {
    name,
    code,
    magnitude: 18,
  },
  {
    name: "Gwei",
    code: "Gwei",
    magnitude: 9,
  },
  {
    name: "Mwei",
    code: "Mwei",
    magnitude: 6,
  },
  {
    name: "Kwei",
    code: "Kwei",
    magnitude: 3,
  },
  {
    name: "wei",
    code: "wei",
    magnitude: 0,
  },
];

// FIXME: We must be aware that we don't handle correcly currencies that use the same `managerApp`
// to fix that we should always have the 'main' currency of the managerapp first in this list
// e.g for Ethereum manager Ethereum is first in the list and other coin are in the bottom of the list
export const cryptocurrenciesById: Record<CryptoCurrencyId, CryptoCurrency> = {
  near: {
    type: "CryptoCurrency",
    id: "near",
    coinType: CoinType.NEAR,
    name: "NEAR",
    managerAppName: "NEAR",
    ticker: "NEAR",
    scheme: "near",
    color: "#000",
    family: "near",
    units: [
      {
        name: "NEAR",
        code: "NEAR",
        magnitude: 24,
      },
      {
        name: "yoctoNEAR",
        code: "yoctoNEAR",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        address: "https://nearblocks.io/address/$address",
        tx: "https://nearblocks.io/txns/$hash",
      },
    ],
    keywords: ["near"],
  },
  aeternity: {
    type: "CryptoCurrency",
    id: "aeternity",
    coinType: CoinType.AE,
    name: "æternity",
    managerAppName: "Aeternity",
    ticker: "AE",
    scheme: "aeternity",
    color: "#f7296e",
    family: "aeternity",
    units: [
      {
        name: "AE",
        code: "AE",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.aepps.com/#/tx/$hash",
      },
    ],
  },
  aion: {
    type: "CryptoCurrency",
    id: "aion",
    coinType: CoinType.AION,
    name: "Aion",
    managerAppName: "Aion",
    ticker: "AION",
    scheme: "aion",
    color: "#000000",
    family: "aion",
    units: [
      {
        name: "AION",
        code: "AION",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  akroma: {
    type: "CryptoCurrency",
    id: "akroma",
    coinType: CoinType.AKA,
    name: "Akroma",
    managerAppName: "Akroma",
    ticker: "AKA",
    scheme: "akroma",
    color: "#AA0087",
    family: "evm",
    units: [
      {
        name: "AKA",
        code: "AKA",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://akroma.io/explorer/transaction/$hash",
      },
    ],
  },
  algorand: {
    type: "CryptoCurrency",
    id: "algorand",
    coinType: CoinType.ALGO,
    name: "Algorand",
    managerAppName: "Algorand",
    ticker: "ALGO",
    scheme: "algorand",
    color: "#000000",
    family: "algorand",
    units: [
      {
        name: "ALGO",
        code: "ALGO",
        magnitude: 6,
      },
      {
        name: "uALGO",
        code: "uALGO",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.perawallet.app/tx/$hash",
      },
    ],
    keywords: ["algo", "algorand"],
  },
  ark: {
    type: "CryptoCurrency",
    id: "ark",
    coinType: CoinType.ARK,
    name: "Ark",
    managerAppName: "Ark",
    ticker: "ARK",
    scheme: "ark",
    color: "#dd3333",
    family: "ark",
    units: [
      {
        name: "ARK",
        code: "ARK",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.ark.io/transaction/$hash",
      },
    ],
  },
  atheios: {
    type: "CryptoCurrency",
    id: "atheios",
    coinType: CoinType.ATH,
    name: "Atheios",
    managerAppName: "Atheios",
    ticker: "ATH",
    scheme: "atheios",
    color: "#000000",
    family: "evm",
    units: [
      {
        name: "ATH",
        code: "ATH",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  avalanche_c_chain: {
    type: "CryptoCurrency",
    id: "avalanche_c_chain",
    coinType: CoinType.ETH,
    name: "Avalanche C-Chain",
    managerAppName: "Avalanche",
    ticker: "AVAX",
    scheme: "avalanche_c_chain",
    color: "#E84142",
    family: "evm",
    units: [
      {
        name: "AVAX",
        code: "AVAX",
        magnitude: 18,
      },
    ],
    ethereumLikeInfo: {
      chainId: 43114,
    },
    explorerViews: [
      {
        tx: "https://cchain.explorer.avax.network/tx/$hash",
        address: "https://cchain.explorer.avax.network/address/$address",
        token: "https://cchain.explorer.avax.network/token/$contractAddress?a=$address",
      },
    ],
    keywords: ["avax", "avalanche", "c-chain"],
    explorerId: "avax",
  },
  axelar: {
    type: "CryptoCurrency",
    id: "axelar",
    coinType: CoinType.ATOM,
    name: "Axelar",
    managerAppName: "Cosmos",
    ticker: "AXL",
    scheme: "axelar",
    color: "#b2b6bc",
    family: "cosmos",
    units: [
      {
        name: "Axelar",
        code: "AXL",
        magnitude: 6,
      },
      {
        name: "Micro-Axelar",
        code: "uaxl",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/axelar/txs/$hash",
        address: "https://www.mintscan.io/axelar/validators/$address",
      },
    ],
  },
  banano: {
    type: "CryptoCurrency",
    id: "banano",
    coinType: CoinType.BANANO,
    name: "Banano",
    managerAppName: "Banano",
    ticker: "BANANO",
    scheme: "banano",
    color: "#000000",
    family: "nano",
    units: [
      {
        name: "BANANO",
        code: "BANANO",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  bitcoin: {
    type: "CryptoCurrency",
    id: "bitcoin",
    coinType: CoinType.BTC,
    name: "Bitcoin",
    managerAppName: "Bitcoin",
    ticker: "BTC",
    scheme: "bitcoin",
    color: "#ffae35",
    symbol: "Ƀ",
    units: bitcoinUnits,
    supportsSegwit: true,
    supportsNativeSegwit: true,
    family: "bitcoin",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 0,
      P2SH: 5,
      XPUBVersion: 0x0488b21e,
    },
    explorerViews: [
      {
        address: "https://blockstream.info/address/$address",
        tx: "https://blockstream.info/tx/$hash",
      },
      {
        address: "https://www.blockchain.com/btc/address/$address",
        tx: "https://blockchain.info/btc/tx/$hash",
      },
    ],
    keywords: ["btc", "bitcoin"],
    explorerId: "btc",
  },
  bitcoin_cash: {
    type: "CryptoCurrency",
    id: "bitcoin_cash",
    forkedFrom: "bitcoin",
    coinType: CoinType.BTC_CASH,
    name: "Bitcoin Cash",
    managerAppName: "Bitcoin Cash",
    ticker: "BCH",
    scheme: "bitcoincash",
    color: "#3ca569",
    family: "bitcoin",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 0,
      P2SH: 5,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "bitcoin cash",
        code: "BCH",
        magnitude: 8,
      },
      {
        name: "mBCH",
        code: "mBCH",
        magnitude: 5,
      },
      {
        name: "bit",
        code: "bit",
        magnitude: 2,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://blockchair.com/bitcoin-cash/transaction/$hash",
        address: "https://blockchair.com/bitcoin-cash/address/$address",
      },
    ],
    explorerId: "bch",
  },
  bitcoin_gold: {
    type: "CryptoCurrency",
    id: "bitcoin_gold",
    forkedFrom: "bitcoin",
    coinType: CoinType.BTC_GOLD,
    name: "Bitcoin Gold",
    managerAppName: "Bitcoin Gold",
    ticker: "BTG",
    scheme: "btg",
    color: "#132c47",
    supportsSegwit: true,
    family: "bitcoin",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 38,
      P2SH: 23,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "bitcoin gold",
        code: "BTG",
        magnitude: 8,
      },
      {
        name: "mBTG",
        code: "mBTG",
        magnitude: 5,
      },
      {
        name: "bit",
        code: "bit",
        magnitude: 2,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://btgexplorer.com/tx/$hash",
        address: "https://btgexplorer.com/address/$address",
      },
    ],
    explorerId: "btg",
  },
  bitcoin_private: {
    type: "CryptoCurrency",
    id: "bitcoin_private",
    forkedFrom: "bitcoin",
    coinType: CoinType.BTC_PRIVATE,
    name: "Bitcoin Private",
    managerAppName: "Bitcoin Private",
    ticker: "BTCP",
    scheme: "btcp",
    color: "#2F2D63",
    family: "bitcoin",
    blockAvgTime: 2.5 * 60,
    units: [
      {
        name: "bitcoin private",
        code: "BTCP",
        magnitude: 8,
      },
      {
        name: "mBTCP",
        code: "mBTCP",
        magnitude: 5,
      },
      {
        name: "bit",
        code: "bit",
        magnitude: 2,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.btcprivate.org/tx/$hash",
        address: "https://explorer.btcprivate.org/address/$address",
      },
    ],
  },
  bsc: {
    type: "CryptoCurrency",
    id: "bsc",
    coinType: CoinType.ETH,
    name: "Binance Smart Chain",
    managerAppName: "Ethereum",
    ticker: "BNB",
    scheme: "bsc",
    color: "#F0B90A",
    family: "evm",
    ethereumLikeInfo: {
      chainId: 56,
    },
    units: ethereumUnits("BNB", "BNB"),
    explorerViews: [
      {
        tx: "https://bscscan.com/tx/$hash",
        address: "https://bscscan.com/address/$address",
        token: "https://bscscan.com/token/$contractAddress?a=$address",
      },
    ],
    keywords: ["bsc", "bnb", "binance", "binance smart chain", "binance chain"],
    explorerId: "bnb",
  },
  callisto: {
    type: "CryptoCurrency",
    id: "callisto",
    coinType: CoinType.CALLISTO,
    name: "Callisto",
    managerAppName: "Callisto",
    ticker: "CLO",
    scheme: "callisto",
    color: "#000000",
    family: "evm",
    units: [
      {
        name: "CLO",
        code: "CLO",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  cardano: {
    type: "CryptoCurrency",
    id: "cardano",
    coinType: CoinType.CARDANO,
    name: "Cardano",
    managerAppName: "Cardano ADA",
    ticker: "ADA",
    scheme: "cardano",
    color: "#0A1D2C",
    family: "cardano",
    blockAvgTime: 20,
    units: [
      {
        name: "ada",
        code: "ADA",
        magnitude: 6,
      },
      {
        name: "Lovelace",
        code: "Lovelace",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://cardanoscan.io/transaction/$hash",
        address: "https://cardanoscan.io/address/$address",
        stakePool: "https://cardanoscan.io/pool/$poolId",
      },
    ],
    keywords: ["ada", "cardano"],
  },
  cardano_testnet: {
    type: "CryptoCurrency",
    id: "cardano_testnet",
    coinType: CoinType.CARDANO,
    name: "Cardano (Testnet)",
    managerAppName: "Cardano ADA",
    ticker: "tADA",
    scheme: "cardano_testnet",
    isTestnetFor: "cardano",
    disableCountervalue: true,
    color: "#0A1D2C",
    family: "cardano",
    blockAvgTime: 20,
    units: [
      {
        name: "ada",
        code: "tADA",
        magnitude: 6,
      },
      {
        name: "Lovelace",
        code: "tLovelace",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://preprod.cardanoscan.io/transaction/$hash",
        address: "https://prerpod.cardanoscan.io/address/$address",
        stakePool: "https://preprod.cardanoscan.io/pool/$poolId",
      },
    ],
  },
  celo: {
    type: "CryptoCurrency",
    id: "celo",
    coinType: CoinType.CELO,
    name: "Celo",
    managerAppName: "Celo",
    blockAvgTime: 5,
    ticker: "CELO",
    scheme: "celo",
    color: "#35D07F",
    family: "celo",
    units: [
      {
        name: "CELO",
        code: "CELO",
        magnitude: 18,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.celo.org/tx/$hash",
        address: "https://explorer.celo.org/address/$address",
      },
    ],
  },
  clubcoin: {
    terminated: {
      link: "https://support.ledger.com/",
    },
    type: "CryptoCurrency",
    id: "clubcoin",
    coinType: CoinType.CLUB,
    name: "Clubcoin",
    managerAppName: "Clubcoin",
    ticker: "CLUB",
    scheme: "club",
    color: "#000000",
    family: "bitcoin",
    blockAvgTime: 140,
    bitcoinLikeInfo: {
      P2PKH: 28,
      P2SH: 85,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "club",
        code: "CLUB",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://chainz.cryptoid.info/club/tx.dws?$hash.htm",
      },
    ],
    explorerId: "club",
  },
  coreum: {
    type: "CryptoCurrency",
    id: "coreum",
    coinType: CoinType.ATOM,
    name: "Coreum",
    managerAppName: "Cosmos",
    ticker: "COREUM",
    scheme: "coreum",
    color: "#6DD39A",
    family: "cosmos",
    units: [
      {
        name: "Core",
        code: "CORE",
        magnitude: 6,
      },
      {
        name: "Micro-Core",
        code: "ucore",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/coreum/txs/$hash",
        address: "https://www.mintscan.io/coreum/validators/$address",
      },
    ],
  },
  cosmos: {
    type: "CryptoCurrency",
    id: "cosmos",
    coinType: CoinType.ATOM,
    name: "Cosmos",
    managerAppName: "Cosmos",
    ticker: "ATOM",
    scheme: "cosmos",
    color: "#16192f",
    family: "cosmos",
    // FIXME: enable it back when confirmation number is fixed
    // blockAvgTime: 8,
    units: [
      {
        name: "Atom",
        code: "ATOM",
        magnitude: 6,
      },
      {
        name: "microAtom",
        code: "uatom",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/cosmos/txs/$hash",
        address: "https://www.mintscan.io/cosmos/validators/$address",
      },
    ],
    keywords: ["atom", "cosmos"],
  },
  cosmos_testnet: {
    type: "CryptoCurrency",
    id: "cosmos_testnet",
    coinType: CoinType.ATOM,
    name: "Cosmos (Testnet)",
    managerAppName: "Cosmos",
    ticker: "MUON",
    scheme: "cosmos_testnet",
    isTestnetFor: "cosmos",
    disableCountervalue: true,
    color: "#16192f",
    family: "cosmos",
    // FIXME: enable it back when confirmation number is fixed
    // blockAvgTime: 8,
    units: [
      {
        name: "Muon",
        code: "MUON",
        magnitude: 6,
      },
      {
        name: "microMuon",
        code: "umuon",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://testnet.mintscan.io/txs/$hash",
        address: "https://testnet.mintscan.io/validators/$address",
      },
    ],
  },
  dash: {
    type: "CryptoCurrency",
    id: "dash",
    coinType: CoinType.DASH,
    name: "Dash",
    managerAppName: "Dash",
    ticker: "DASH",
    scheme: "dash",
    color: "#0e76aa",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 76,
      P2SH: 16,
      XPUBVersion: 0x02fe52f8,
    },
    units: [
      {
        name: "dash",
        code: "DASH",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.dash.org/insight/tx/$hash",
        address: "https://explorer.dash.org/insight/address/$address",
      },
    ],
    explorerId: "dash",
  },
  decred: {
    type: "CryptoCurrency",
    id: "decred",
    coinType: CoinType.DECRED,
    name: "Decred",
    managerAppName: "Decred",
    ticker: "DCR",
    scheme: "decred",
    color: "#2f74fb",
    units: [
      {
        name: "decred",
        code: "DCR",
        magnitude: 8,
      },
      {
        name: "milli-decred",
        code: "mDCR",
        magnitude: 5,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    family: "bitcoin",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 0x073f,
      P2SH: 0x071a,
      XPUBVersion: 0x02fda926,
    },
    explorerViews: [
      {
        tx: "https://mainnet.decred.org/tx/$hash",
        address: "https://mainnet.decred.org/address/$address",
      },
    ],
    explorerId: "dcr",
  },
  desmos: {
    type: "CryptoCurrency",
    id: "desmos",
    coinType: CoinType.ATOM,
    name: "Desmos",
    managerAppName: "Cosmos",
    ticker: "DSM",
    scheme: "desmos",
    color: "#ed6c53",
    family: "cosmos",
    units: [
      {
        name: "Desmos",
        code: "DSM",
        magnitude: 6,
      },
      {
        name: "Micro-Desmos",
        code: "udsm",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/desmos/txs/$hash",
        address: "https://www.mintscan.io/desmos/validators/$address",
      },
    ],
  },
  dexon: {
    type: "CryptoCurrency",
    id: "dexon",
    coinType: CoinType.DEXON,
    name: "DEXON",
    managerAppName: "DEXON",
    ticker: "DXN",
    scheme: "dexon",
    color: "#000000",
    family: "evm",
    units: [
      {
        name: "dexon",
        code: "DXN",
        magnitude: 6,
      },
    ],
    explorerViews: [
      {
        tx: "https://dexonscan.app/transaction/$hash",
        address: "https://dexonscan.app/address/$address",
      },
    ],
  },
  digibyte: {
    type: "CryptoCurrency",
    id: "digibyte",
    coinType: CoinType.DIGIBYTE,
    name: "DigiByte",
    managerAppName: "Digibyte",
    ticker: "DGB",
    scheme: "digibyte",
    color: "#0066cc",
    family: "bitcoin",
    supportsSegwit: true,
    supportsNativeSegwit: true,
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 30,
      P2SH: 63,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "digibyte",
        code: "DGB",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://digiexplorer.info/tx/$hash",
        address: "https://digiexplorer.info/address/$address",
      },
    ],
    explorerId: "dgb",
  },
  dogecoin: {
    type: "CryptoCurrency",
    id: "dogecoin",
    coinType: CoinType.DOGE,
    name: "Dogecoin",
    managerAppName: "Dogecoin",
    ticker: "DOGE",
    scheme: "dogecoin",
    color: "#65d196",
    family: "bitcoin",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 30,
      P2SH: 22,
      XPUBVersion: 0x02facafd,
    },
    symbol: "Ð",
    units: [
      {
        name: "dogecoin",
        code: "DOGE",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://dogechain.info/tx/$hash",
        address: "https://dogechain.info/address/$address",
      },
    ],
    keywords: ["doge", "dogecoin"],
    explorerId: "doge",
  },
  dydx: {
    type: "CryptoCurrency",
    id: "dydx",
    coinType: CoinType.ATOM,
    name: "dYdX",
    managerAppName: "Cosmos",
    ticker: "DYDX",
    scheme: "dydx",
    color: "#6666FF",
    family: "cosmos",
    units: [
      {
        name: "dYdX",
        code: "dydx",
        magnitude: 18,
      },
      {
        name: "Micro-dydx",
        code: "adydx",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/dydx/txs/$hash",
        address: "https://www.mintscan.io/dydx/validators/$address",
      },
    ],
  },
  elastos: {
    type: "CryptoCurrency",
    id: "elastos",
    coinType: CoinType.ELASTOS,
    name: "Elastos",
    managerAppName: "Elastos",
    ticker: "ELA",
    scheme: "elastos",
    color: "#000",
    family: "elastos",
    units: [
      {
        name: "ELA",
        code: "ELA",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  ellaism: {
    type: "CryptoCurrency",
    id: "ellaism",
    coinType: CoinType.ELLAISM,
    name: "Ellaism",
    managerAppName: "Ellaism",
    ticker: "ELLA",
    scheme: "ellaism",
    color: "#000000",
    family: "evm",
    units: [
      {
        name: "ELLA",
        code: "ELLA",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  elrond: {
    type: "CryptoCurrency",
    id: "elrond",
    coinType: CoinType.MULTIVERSX,
    name: "MultiversX",
    managerAppName: "MultiversX",
    ticker: "EGLD",
    scheme: "elrond",
    color: "#23F7DD",
    family: "elrond",
    blockAvgTime: 6,
    deviceTicker: "EGLD",
    units: [
      {
        name: "EGLD",
        code: "EGLD",
        magnitude: 18,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.elrond.com/transactions/$hash",
        address: "https://explorer.elrond.com/accounts/$address",
      },
    ],
    keywords: ["elrond"],
  },
  eos: {
    type: "CryptoCurrency",
    id: "eos",
    coinType: CoinType.EOS,
    name: "EOS",
    managerAppName: "Eos",
    ticker: "EOS",
    scheme: "eos",
    color: "#000000",
    family: "eos",
    units: [
      {
        name: "EOS",
        code: "EOS",
        magnitude: 2,
      },
    ],
    explorerViews: [],
  },
  ethereum: {
    type: "CryptoCurrency",
    id: "ethereum",
    coinType: CoinType.ETH,
    name: "Ethereum",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "ethereum",
    color: "#0ebdcd",
    symbol: "Ξ",
    family: "evm",
    blockAvgTime: 15,
    units: ethereumUnits("ether", "ETH"),
    ethereumLikeInfo: {
      chainId: 1,
    },
    explorerViews: [
      {
        tx: "https://etherscan.io/tx/$hash",
        address: "https://etherscan.io/address/$address",
        token: "https://etherscan.io/token/$contractAddress?a=$address",
      },
    ],
    keywords: ["eth", "ethereum"],
    explorerId: "eth",
  },
  ethereum_classic: {
    type: "CryptoCurrency",
    id: "ethereum_classic",
    coinType: CoinType.ETH_CLASSIC,
    name: "Ethereum Classic",
    managerAppName: "Ethereum Classic",
    ticker: "ETC",
    scheme: "ethereumclassic",
    color: "#3ca569",
    units: ethereumUnits("ETC", "ETC"),
    family: "evm",
    blockAvgTime: 15,
    ethereumLikeInfo: {
      chainId: 61,
    },
    explorerViews: [
      {
        tx: "https://blockscout.com/etc/mainnet/tx/$hash/internal-transactions",
        address: "https://blockscout.com/etc/mainnet/address/$address/transactions",
      },
    ],
    keywords: ["etc", "ethereum classic"],
    explorerId: "etc",
  },
  ether1: {
    type: "CryptoCurrency",
    id: "ether1",
    coinType: CoinType.ETH_CLASSIC,
    name: "Ether1",
    managerAppName: "Ether-1",
    ticker: "ETHO",
    scheme: "ether1",
    color: "#000000",
    units: ethereumUnits("ETHO", "ETHO"),
    family: "evm",
    blockAvgTime: 15,
    explorerViews: [],
  },
  ethergem: {
    type: "CryptoCurrency",
    id: "ethergem",
    coinType: CoinType.ETH_CLASSIC,
    name: "EtherGem",
    managerAppName: "EtherGem",
    ticker: "EGEM",
    scheme: "ethergem",
    color: "#000000",
    units: ethereumUnits("EGEM", "EGEM"),
    family: "evm",
    blockAvgTime: 15,
    explorerViews: [],
  },
  ethersocial: {
    type: "CryptoCurrency",
    id: "ethersocial",
    coinType: CoinType.ETH_CLASSIC,
    name: "Ethersocial",
    managerAppName: "Ethersocial",
    ticker: "ESN",
    scheme: "ethersocial",
    color: "#000000",
    units: ethereumUnits("ESN", "ESN"),
    family: "evm",
    blockAvgTime: 15,
    explorerViews: [],
  },
  expanse: {
    type: "CryptoCurrency",
    id: "expanse",
    coinType: CoinType.EXPANSE,
    name: "Expanse",
    managerAppName: "Expanse",
    ticker: "EXP",
    scheme: "expanse",
    color: "#EE4500",
    family: "evm",
    units: [
      {
        name: "EXP",
        code: "EXP",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://gander.tech/tx/$hash",
      },
    ],
  },
  factom: {
    type: "CryptoCurrency",
    id: "factom",
    coinType: CoinType.FACTOM,
    name: "Factom",
    managerAppName: "Factom",
    ticker: "FCT",
    scheme: "factom",
    color: "#2F2879",
    family: "factom",
    units: [
      {
        name: "FCT",
        code: "FCT",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  fic: {
    type: "CryptoCurrency",
    id: "fic",
    coinType: CoinType.FIC,
    name: "FIC",
    managerAppName: "FIC",
    ticker: "FIC",
    scheme: "fic",
    color: "#5157D8",
    family: "fic",
    units: [
      {
        name: "FIC",
        code: "FIC",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  flow: {
    type: "CryptoCurrency",
    id: "flow",
    coinType: CoinType.FLOW,
    name: "Flow",
    managerAppName: "Flow",
    ticker: "FLOW",
    scheme: "flow",
    color: "#000",
    family: "flow",
    units: [
      {
        name: "FLOW",
        code: "FLOW",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  game_credits: {
    type: "CryptoCurrency",
    id: "game_credits",
    coinType: CoinType.GAME,
    name: "GameCredits",
    managerAppName: "GameCredits",
    ticker: "GAME",
    scheme: "game",
    color: "#24485D",
    family: "bitcoin",
    units: [
      {
        name: "GAME",
        code: "GAME",
        magnitude: 8,
      },
    ],
    bitcoinLikeInfo: {
      P2PKH: 38,
      P2SH: 62,
    },
    explorerViews: [],
  },
  gochain: {
    type: "CryptoCurrency",
    id: "gochain",
    coinType: CoinType.GOCHAIN,
    name: "GoChain",
    managerAppName: "GoChain",
    ticker: "GO",
    scheme: "gochain",
    color: "#000000",
    family: "evm",
    units: [
      {
        name: "GO",
        code: "GO",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  groestlcoin: {
    type: "CryptoCurrency",
    id: "groestcoin",
    coinType: CoinType.GRS,
    name: "Groestlcoin",
    managerAppName: "Groestlcoin",
    ticker: "GRS",
    scheme: "groestcoin",
    color: "#0299C0",
    family: "groestcoin",
    blockAvgTime: 60,
    units: [
      {
        name: "GRS",
        code: "GRS",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://chainz.cryptoid.info/grs/tx.dws?$hash.htm",
      },
    ],
  },
  hcash: {
    type: "CryptoCurrency",
    id: "hcash",
    coinType: CoinType.HCASH,
    name: "Hcash",
    managerAppName: "HCash",
    ticker: "HSR",
    scheme: "hcash",
    color: "#56438c",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 40,
      P2SH: 100,
      XPUBVersion: 0x0488c21e,
    },
    units: [
      {
        name: "hcash",
        code: "HSR",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [],
    terminated: {
      link: "https://support.ledger.com/hc/en-us/articles/115003917133",
    },
    explorerId: "hsr",
  },
  hedera: {
    type: "CryptoCurrency",
    id: "hedera",
    coinType: CoinType.HEDERA,
    name: "Hedera",
    managerAppName: "Hedera",
    ticker: "HBAR",
    scheme: "hedera",
    color: "#000",
    family: "hedera",
    units: [
      {
        name: "HBAR",
        code: "HBAR",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://hashscan.io/mainnet/transaction/$hash",
        address: "https://hashscan.io/mainnet/account/$address",
      },
    ],
  },
  helium: {
    type: "CryptoCurrency",
    id: "helium",
    coinType: CoinType.HELIUM,
    name: "Helium",
    managerAppName: "Helium",
    ticker: "HNT",
    scheme: "helium",
    color: "#474DFF",
    family: "helium",
    units: [
      {
        name: "HNT",
        code: "HNT",
        magnitude: 8,
      },
      {
        name: "bones",
        code: "bones",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.helium.com/txns/$hash",
        address: "https://explorer.helium.com/accounts/$address",
      },
    ],
  },
  hpb: {
    type: "CryptoCurrency",
    id: "hpb",
    coinType: CoinType.HPB,
    name: "High Performance Blockchain",
    managerAppName: "HPB",
    ticker: "HPB",
    scheme: "hpb",
    color: "#3B3BE2",
    family: "evm",
    units: [
      {
        name: "hpb",
        code: "HPB",
        magnitude: 18,
      },
    ],
    blockAvgTime: 6,
    explorerViews: [
      {
        tx: "https://hpbscan.org/tx/$hash",
        address: "https://hpbscan.org/address/$address",
      },
    ],
  },
  hycon: {
    type: "CryptoCurrency",
    id: "hycon",
    coinType: CoinType.HYCON,
    name: "Hycon",
    managerAppName: "Hycon",
    ticker: "HYC",
    scheme: "hycon",
    color: "#00B3FF",
    family: "hycon",
    units: [
      {
        name: "HYCON",
        code: "HYCON",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.hycon.io/tx/$hash",
        address: "https://explorer.hycon.io/address/$address",
      },
    ],
  },
  icon: {
    type: "CryptoCurrency",
    id: "icon",
    coinType: CoinType.ICON,
    name: "ICON",
    managerAppName: "ICON",
    ticker: "ICX",
    scheme: "icon",
    color: "#00A3B4",
    family: "icon",
    units: [
      {
        name: "ICX",
        code: "ICX",
        magnitude: 18,
      },
    ],
    explorerViews: [
      {
        tx: "https://tracker.icon.community/transaction/$hash",
        address: "https://tracker.icon.community/address/$address",
      },
    ],
  },
  icon_berlin_testnet: {
    type: "CryptoCurrency",
    id: "icon_berlin_testnet",
    coinType: CoinType.ICON,
    name: "ICON Berlin Testnet",
    managerAppName: "ICON",
    ticker: "ICX",
    scheme: "icon_berlin_testnet",
    color: "#00A3B4",
    family: "icon",
    isTestnetFor: "icon",
    units: [
      {
        name: "ICX",
        code: "ICX",
        magnitude: 18,
      },
    ],
    explorerViews: [
      {
        tx: "https://tracker.berlin.icon.community/transaction/$hash",
        address: "https://tracker.berlin.icon.community/address/$address",
      },
    ],
  },
  iota: {
    type: "CryptoCurrency",
    id: "iota",
    coinType: CoinType.IOTA,
    name: "IOTA",
    managerAppName: "IOTA",
    ticker: "MIOTA",
    scheme: "iota",
    color: "#000000",
    family: "iota",
    units: [
      {
        name: "IOTA",
        code: "IOTA",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  iov: {
    type: "CryptoCurrency",
    id: "iov",
    coinType: CoinType.IOV,
    name: "IOV",
    managerAppName: "IOV",
    ticker: "IOV",
    scheme: "iov",
    color: "#000",
    family: "iov",
    units: [
      {
        name: "IOV",
        code: "IOV",
        magnitude: 6,
      },
    ],
    explorerViews: [],
  },
  kin: {
    type: "CryptoCurrency",
    id: "kin",
    coinType: CoinType.KIN,
    name: "Kin",
    managerAppName: "Kin",
    ticker: "KIN",
    scheme: "kin",
    color: "#0C4DD6",
    family: "stellar",
    units: [
      {
        name: "KIN",
        code: "KIN",
        magnitude: 5,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.kin.org/blockchainInfoPage/?&dataType=public&header=Transaction&id=$hash",
        address:
          "https://www.kin.org/blockchainAccount/?&dataType=public&header=accountID&id=$address",
      },
    ],
  },
  komodo: {
    type: "CryptoCurrency",
    id: "komodo",
    coinType: CoinType.KOMODO,
    name: "Komodo",
    managerAppName: "Komodo",
    ticker: "KMD",
    scheme: "komodo",
    color: "#326464",
    family: "bitcoin",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 60,
      P2SH: 85,
      XPUBVersion: 0xf9eee48d,
    },
    units: [
      {
        name: "komodo",
        code: "KMD",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://kmdexplorer.io/tx/$hash",
        address: "https://kmdexplorer.io/address/$address",
      },
    ],
    explorerId: "kmd",
  },
  kusama: {
    type: "CryptoCurrency",
    id: "kusama",
    coinType: CoinType.KUSAMA,
    name: "Kusama",
    managerAppName: "Kusama",
    ticker: "KSM",
    scheme: "kusama",
    color: "#000",
    family: "kusama",
    units: [
      {
        name: "KSM",
        code: "KSM",
        magnitude: 12,
      },
    ],
    explorerViews: [],
  },
  lbry: {
    type: "CryptoCurrency",
    id: "LBRY",
    coinType: CoinType.LBRY,
    name: "LBRY",
    managerAppName: "LBRY",
    ticker: "LBRY",
    scheme: "LBRY",
    color: "#000",
    family: "bitcoin",
    units: [
      {
        name: "LBRY",
        code: "LBRY",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  litecoin: {
    type: "CryptoCurrency",
    id: "litecoin",
    coinType: CoinType.LITECOIN,
    name: "Litecoin",
    managerAppName: "Litecoin",
    ticker: "LTC",
    scheme: "litecoin",
    color: "#cccccc",
    supportsSegwit: true,
    supportsNativeSegwit: true,
    family: "bitcoin",
    blockAvgTime: 5 * 60,
    bitcoinLikeInfo: {
      P2PKH: 48,
      P2SH: 50,
      XPUBVersion: 0x019da462,
    },
    symbol: "Ł",
    units: [
      {
        name: "litecoin",
        code: "LTC",
        magnitude: 8,
      },
      {
        name: "mLTC",
        code: "mLTC",
        magnitude: 5,
      },
      {
        name: "litoshi",
        code: "litoshi",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://live.blockcypher.com/ltc/tx/$hash",
        address: "https://live.blockcypher.com/ltc/address/$address",
      },
    ],
    keywords: ["ltc", "litecoin"],
    explorerId: "ltc",
  },
  lisk: {
    type: "CryptoCurrency",
    id: "lisk",
    coinType: CoinType.LISK,
    name: "lisk",
    managerAppName: "Lisk",
    ticker: "LSK",
    scheme: "lisk",
    color: "#16213D",
    family: "lisk",
    units: [
      {
        name: "LSK",
        code: "LSK",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  mix: {
    type: "CryptoCurrency",
    id: "mix",
    coinType: CoinType.MIX,
    name: "MIX Blockchain",
    managerAppName: "Mix",
    ticker: "MIX",
    scheme: "mix",
    color: "#00C4DF",
    family: "evm",
    units: [
      {
        name: "MIX",
        code: "MIX",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  monero: {
    type: "CryptoCurrency",
    id: "monero",
    coinType: CoinType.MONERO,
    name: "Monero",
    managerAppName: "Monero",
    ticker: "XMR",
    scheme: "monero",
    color: "#FF5900",
    family: "monero",
    units: [
      {
        name: "XMR",
        code: "XMR",
        magnitude: 12,
      },
    ],
    explorerViews: [
      {
        tx: "https://moneroblocks.info/tx/$hash",
      },
    ],
    keywords: ["xmr", "monero"],
  },
  musicoin: {
    type: "CryptoCurrency",
    id: "musicoin",
    coinType: CoinType.MUSICOIN,
    name: "Musicoin",
    managerAppName: "Musicoin",
    ticker: "MUSIC",
    scheme: "musicoin",
    color: "#000000",
    family: "evm",
    units: [
      {
        name: "MUSIC",
        code: "MUSIC",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  nano: {
    type: "CryptoCurrency",
    id: "nano",
    coinType: CoinType.NANO,
    name: "Nano",
    managerAppName: "Nano",
    ticker: "NANO",
    scheme: "nano",
    color: "#4E8FB6",
    family: "nano",
    units: [
      {
        name: "NANO",
        code: "NANO",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://nanolooker.com/block/$hash",
        address: "https://nanolooker.com/account/$address",
      },
      {
        tx: "https://nanoexplorer.io/blocks/$hash",
      },
    ],
  },
  nem: {
    type: "CryptoCurrency",
    id: "nem",
    coinType: CoinType.NEM,
    name: "NEM",
    managerAppName: "NEM",
    ticker: "XEM",
    scheme: "nem",
    color: "#000",
    family: "nem",
    units: [
      {
        name: "XEM",
        code: "XEM",
        magnitude: 6,
      },
    ],
    explorerViews: [],
  },
  neo: {
    type: "CryptoCurrency",
    id: "neo",
    coinType: CoinType.NEO,
    name: "Neo",
    managerAppName: "NEO",
    ticker: "NEO",
    scheme: "neo",
    color: "#09C300",
    family: "neo",
    units: [
      {
        name: "NEO",
        code: "NEO",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://neotracker.io/tx/$hash",
      },
    ],
  },
  nervos: {
    type: "CryptoCurrency",
    id: "nervos",
    coinType: CoinType.NERVOS,
    name: "Nervos",
    managerAppName: "Nervos",
    ticker: "CKB",
    scheme: "nervos",
    color: "#3EC58A",
    family: "nervos",
    units: [
      {
        name: "CKB",
        code: "CKB",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.nervos.org/transaction/$hash",
        address: "https://explorer.nervos.org/address/$address",
      },
    ],
  },
  nimiq: {
    type: "CryptoCurrency",
    id: "nimiq",
    coinType: CoinType.NIMIQ,
    name: "Nimiq",
    managerAppName: "Nimiq",
    ticker: "NIM",
    scheme: "nimiq",
    color: "#FFBE00",
    family: "nimiq",
    units: [
      {
        name: "NIM",
        code: "NIM",
        magnitude: 5,
      },
    ],
    explorerViews: [
      {
        tx: "https://nimiq.watch/#$hash",
      },
    ],
  },
  nix: {
    type: "CryptoCurrency",
    id: "nix",
    coinType: CoinType.NIX,
    name: "Nix",
    managerAppName: "NIX",
    ticker: "NIX",
    scheme: "nix",
    color: "#344cff",
    supportsSegwit: true,
    family: "bitcoin",
    blockAvgTime: 120,
    bitcoinLikeInfo: {
      P2PKH: 38,
      P2SH: 53,
    },
    units: [
      {
        name: "nix",
        code: "NIX",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://blockchain.nixplatform.io/tx/$hash",
      },
    ],
  },
  nos: {
    type: "CryptoCurrency",
    id: "nos",
    name: "NOS",
    coinType: CoinType.NOS,
    managerAppName: "NOS",
    ticker: "NOS",
    scheme: "nos",
    color: "#2B92D3",
    family: "nano",
    units: [
      {
        name: "NOS",
        code: "NOS",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  nyx: {
    type: "CryptoCurrency",
    id: "nyx",
    coinType: CoinType.ATOM,
    name: "Nyx",
    managerAppName: "Cosmos",
    ticker: "NYX",
    scheme: "nyx",
    color: "#5f82c8",
    family: "cosmos",
    units: [
      {
        name: "Nyx",
        code: "NYX",
        magnitude: 6,
      },
      {
        name: "Micro-Nyx",
        code: "unyx",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/nyx/txs/$hash",
        address: "https://www.mintscan.io/nyx/validators/$address",
      },
    ],
  },
  onomy: {
    type: "CryptoCurrency",
    id: "onomy",
    coinType: CoinType.ATOM,
    name: "Onomy",
    managerAppName: "Cosmos",
    ticker: "NOM",
    scheme: "onomy",
    color: "#8c94d3",
    family: "cosmos",
    units: [
      {
        name: "Onomy",
        code: "NOM",
        magnitude: 18,
      },
      {
        name: "Micro-Onomy",
        code: "anom",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/onomy-protocol/txs/$hash",
        address: "https://www.mintscan.io/onomy-protocl/validators/$address",
      },
    ],
  },
  ontology: {
    type: "CryptoCurrency",
    id: "ontology",
    coinType: CoinType.ONTOLOGY,
    name: "Ontology",
    managerAppName: "ONT",
    ticker: "ONT",
    scheme: "ontology",
    color: "#00A6C2",
    family: "ontology",
    units: [
      {
        name: "ONT",
        code: "ONT",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.ont.io/transaction/$hash",
      },
    ],
  },
  particl: {
    type: "CryptoCurrency",
    id: "particl",
    coinType: CoinType.PARTICL,
    name: "Particl",
    managerAppName: "Particl",
    ticker: "PART",
    scheme: "particl",
    color: "#00E3A4",
    family: "particl",
    units: [
      {
        name: "PART",
        code: "PART",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.particl.io/tx/$hash",
      },
    ],
  },
  persistence: {
    type: "CryptoCurrency",
    id: "persistence",
    coinType: CoinType.ATOM,
    name: "Persistence",
    managerAppName: "Cosmos",
    ticker: "XPRT",
    scheme: "persistence",
    color: "#e50a13",
    family: "cosmos",
    units: [
      {
        name: "Persistence",
        code: "XPRT",
        magnitude: 6,
      },
      {
        name: "Micro-Persistence",
        code: "uxprt",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/persistence/txs/$hash",
        address: "https://www.mintscan.io/persistence/validators/$address",
      },
    ],
  },
  pirl: {
    type: "CryptoCurrency",
    id: "pirl",
    coinType: CoinType.PIRL,
    name: "Pirl",
    managerAppName: "Pirl",
    ticker: "PIRL",
    scheme: "pirl",
    color: "#A2D729",
    family: "evm",
    units: [
      {
        name: "PIRL",
        code: "PIRL",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://poseidon.pirl.io/explorer/transaction/$hash",
      },
    ],
  },
  poa: {
    type: "CryptoCurrency",
    id: "poa",
    coinType: CoinType.POA,
    name: "POA",
    managerAppName: "POA",
    ticker: "POA",
    scheme: "poa",
    color: "#4D46BD",
    family: "evm",
    units: [
      {
        name: "POA",
        code: "POA",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://poaexplorer.com/tx/$hash",
      },
    ],
  },
  polkadot: {
    type: "CryptoCurrency",
    id: "polkadot",
    coinType: CoinType.POLKADOT,
    name: "Polkadot",
    managerAppName: "Polkadot",
    ticker: "DOT",
    scheme: "polkadot",
    color: "#E6007A",
    family: "polkadot",
    units: [
      {
        name: "DOT",
        code: "DOT",
        magnitude: 10,
      },
      {
        name: "planck",
        code: "PLANCK",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        address: "https://polkadot.subscan.io/account/$address",
        tx: "https://polkadot.subscan.io/extrinsic/$hash",
      },
      {
        address: "https://polkascan.io/polkadot/account/$address",
        tx: "https://polkascan.io/polkadot/transaction/$hash",
      },
    ],
    keywords: ["dot", "polkadot"],
  },
  polygon: {
    type: "CryptoCurrency",
    id: "polygon",
    coinType: CoinType.ETH,
    name: "Polygon",
    managerAppName: "Ethereum",
    ticker: "POL",
    scheme: "polygon",
    color: "#6d29de",
    family: "evm",
    ethereumLikeInfo: {
      chainId: 137,
    },
    units: ethereumUnits("POL", "POL"),
    explorerViews: [
      {
        tx: "https://polygonscan.com/tx/$hash",
        address: "https://polygonscan.com/address/$address",
        token: "https://polygonscan.com/token/$contractAddress?a=$address",
      },
    ],
    keywords: ["matic", "polygon"],
    explorerId: "matic",
  },
  poswallet: {
    type: "CryptoCurrency",
    id: "poswallet",
    coinType: CoinType.POSWALLET,
    name: "PosW",
    managerAppName: "PoSW",
    ticker: "POSW",
    scheme: "posw",
    // FIXME
    color: "#000000",
    family: "bitcoin",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 55,
      P2SH: 85,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "posw",
        code: "POSW",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [],
    terminated: {
      link: "https://support.ledger.com/hc/en-us/articles/115005175309",
    },
    explorerId: "posw",
  },
  qrl: {
    type: "CryptoCurrency",
    id: "qrl",
    coinType: CoinType.QRL,
    name: "QRL",
    ticker: "QRL",
    managerAppName: "QRL",
    scheme: "qrl",
    color: "#1D2951",
    family: "qrl",
    blockAvgTime: 60,
    units: [
      {
        name: "QRL",
        code: "QRL",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.theqrl.org/tx/$hash",
        address: "https://explorer.theqrl.org/a/$address",
      },
    ],
  },
  qtum: {
    type: "CryptoCurrency",
    id: "qtum",
    coinType: CoinType.QTUM,
    name: "Qtum",
    managerAppName: "Qtum",
    supportsSegwit: true,
    ticker: "QTUM",
    scheme: "qtum",
    color: "#2e9ad0",
    family: "bitcoin",
    blockAvgTime: 2 * 60,
    bitcoinLikeInfo: {
      P2PKH: 58,
      P2SH: 50,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "qtum",
        code: "QTUM",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.qtum.org/tx/$hash",
        address: "https://explorer.qtum.org/address/$address",
      },
    ],
    explorerId: "qtum",
  },
  quicksilver: {
    type: "CryptoCurrency",
    id: "quicksilver",
    coinType: CoinType.ATOM,
    name: "Quicksilver",
    managerAppName: "Cosmos",
    ticker: "QCK",
    scheme: "quicksilver",
    color: "#9b9b9b",
    family: "cosmos",
    units: [
      {
        name: "Quicksilver",
        code: "QCK",
        magnitude: 6,
      },
      {
        name: "Micro-Quicksilver",
        code: "uqck",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/quicksilver/txs/$hash",
        address: "https://www.mintscan.io/quicksilver/validators/$address",
      },
    ],
  },
  ravencoin: {
    type: "CryptoCurrency",
    id: "ravencoin",
    coinType: CoinType.RAVECOIN,
    name: "Ravencoin",
    managerAppName: "Ravencoin",
    ticker: "RVN",
    scheme: "ravencoin",
    color: "#000",
    family: "bitcoin",
    units: [
      {
        name: "RVN",
        code: "RVN",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  ripple: {
    type: "CryptoCurrency",
    id: "ripple",
    coinType: CoinType.RIPPLE,
    name: "XRP",
    managerAppName: "XRP",
    ticker: "XRP",
    scheme: "ripple",
    color: "#27a2db",
    units: [
      {
        name: "XRP",
        code: "XRP",
        magnitude: 6,
      },
      {
        name: "drop",
        code: "drop",
        magnitude: 0,
      },
    ],
    family: "xrp",
    explorerViews: [
      {
        tx: "https://bithomp.com/explorer/$hash",
        address: "https://bithomp.com/explorer/$address",
      },
    ],
    keywords: ["xrp", "ripple"],
  },
  rise: {
    type: "CryptoCurrency",
    id: "rise",
    coinType: CoinType.RISE,
    name: "Rise",
    managerAppName: "Rise",
    ticker: "RISE",
    scheme: "rise",
    color: "#FC1E4F",
    family: "rise",
    blockAvgTime: 30,
    units: [
      {
        name: "RISE",
        code: "RISE",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.rise.vision/tx/$hash",
        address: "https://explorer.rise.vision/tx/$address",
      },
    ],
  },
  reosc: {
    type: "CryptoCurrency",
    id: "reosc",
    coinType: CoinType.REOSC,
    name: "REOSC",
    managerAppName: "REOSC",
    ticker: "REOSC",
    scheme: "reosc",
    color: "#0E00FF",
    family: "evm",
    units: [
      {
        name: "REOSC",
        code: "REOSC",
        magnitude: 16,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.reosc.io/tx/$hash",
        address: "https://explorer.reosc.io/addr/$address",
      },
    ],
  },
  resistance: {
    type: "CryptoCurrency",
    id: "resistance",
    coinType: CoinType.RESISTANCE,
    name: "Resistance",
    managerAppName: "Resistance",
    ticker: "RES",
    scheme: "resistance",
    color: "#000",
    family: "bitcoin",
    units: [
      {
        name: "RES",
        code: "RES",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  secret_network: {
    type: "CryptoCurrency",
    id: "secret_network",
    coinType: CoinType.ATOM,
    name: "SecretNetwork",
    managerAppName: "Cosmos",
    ticker: "SCRT",
    scheme: "secret_network",
    color: "#a3b0bd",
    family: "cosmos",
    units: [
      {
        name: "Secret",
        code: "SCRT",
        magnitude: 6,
      },
      {
        name: "Micro-Secret",
        code: "uscrt",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/secret/txs/$hash",
        address: "https://www.mintscan.io/secret/validators/$address",
      },
    ],
  },
  sei_network: {
    type: "CryptoCurrency",
    id: "sei_network",
    coinType: CoinType.ATOM,
    name: "SeiNetwork",
    managerAppName: "Cosmos",
    ticker: "SEI",
    scheme: "sei_network",
    color: "#89395b",
    family: "cosmos",
    units: [
      {
        name: "SEI",
        code: "SEI",
        magnitude: 6,
      },
      {
        name: "Micro-SEI",
        code: "usei",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/sei/txs/$hash",
        address: "https://www.mintscan.io/sei/validators/$address",
      },
    ],
  },
  solana: {
    type: "CryptoCurrency",
    id: "solana",
    coinType: CoinType.SOLANA,
    name: "Solana",
    managerAppName: "Solana",
    ticker: "SOL",
    scheme: "solana",
    color: "#000",
    family: "solana",
    units: [
      {
        name: "SOL",
        code: "SOL",
        magnitude: 9,
      },
      {
        name: "lamports",
        code: "lamports",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        address: "https://explorer.solana.com/address/$address",
        tx: "https://explorer.solana.com/tx/$hash",
      },
      {
        address: "https://solanabeach.io/address/$address",
        tx: "https://solanabeach.io/transaction/$hash",
      },
    ],
    keywords: ["sol", "solana"],
  },
  stakenet: {
    type: "CryptoCurrency",
    id: "stakenet",
    coinType: CoinType.STAKENET,
    name: "Stakenet",
    managerAppName: "XSN",
    ticker: "XSN",
    scheme: "xsn",
    terminated: {
      link: "https://support.ledger.com/",
    },
    color: "#141828",
    supportsSegwit: true,
    family: "bitcoin",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 76,
      P2SH: 16,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "xsn",
        code: "XSN",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://xsnexplorer.io/transactions/$hash",
        address: "https://xsnexplorer.io/addresses/$address",
      },
    ],
  },
  stargaze: {
    type: "CryptoCurrency",
    id: "stargaze",
    coinType: CoinType.ATOM,
    name: "Stargaze",
    managerAppName: "Cosmos",
    ticker: "STARS",
    scheme: "stargaze",
    color: "#e38cd4",
    family: "cosmos",
    units: [
      {
        name: "Stargaze",
        code: "STARS",
        magnitude: 6,
      },
      {
        name: "Micro-Stargaze",
        code: "ustars",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/stargaze/txs/$hash",
        address: "https://www.mintscan.io/stargaze/validators/$address",
      },
    ],
  },
  stratis: {
    terminated: {
      link: "https://support.ledger.com/",
    },
    type: "CryptoCurrency",
    id: "stratis",
    coinType: CoinType.STRATIS,
    name: "Stratis",
    managerAppName: "Stratis",
    ticker: "STRAT",
    scheme: "stratis",
    color: "#1382c6",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 63,
      P2SH: 125,
      XPUBVersion: 0x0488c21e,
    },
    units: [
      {
        name: "stratis",
        code: "STRAT",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://chainz.cryptoid.info/strat/tx.dws?$hash.htm",
        address: "https://chainz.cryptoid.info/strat/address.dws?$address.htm",
      },
    ],
    explorerId: "strat",
  },
  stellar: {
    type: "CryptoCurrency",
    id: "stellar",
    coinType: CoinType.STELLAR,
    name: "Stellar",
    managerAppName: "Stellar",
    ticker: "XLM",
    scheme: "stellar",
    color: "#000000",
    family: "stellar",
    units: [
      {
        name: "Lumen",
        code: "XLM",
        magnitude: 7,
      },
      {
        name: "stroop",
        code: "stroop",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://stellar.expert/explorer/public/tx/$hash",
      },
    ],
    keywords: ["xlm", "stellar"],
  },
  osmosis: {
    type: "CryptoCurrency",
    id: "osmo",
    coinType: CoinType.ATOM,
    name: "Osmosis",
    managerAppName: "Cosmos",
    ticker: "OSMO",
    scheme: "osmo",
    color: "#493c9b",
    family: "cosmos",
    units: [
      {
        name: "Osmosis",
        code: "OSMO",
        magnitude: 6,
      },
      {
        name: "Micro-OSMO",
        code: "uosmo",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/osmosis/txs/$hash",
        address: "https://www.mintscan.io/osmosis/validators/$address",
      },
    ],
  },
  shyft: {
    type: "CryptoCurrency",
    id: "shyft",
    coinType: CoinType.SHYFT,
    name: "Shyft",
    managerAppName: "Shyft",
    ticker: "SHFT",
    scheme: "shfyt",
    color: "#662c5e",
    family: "shyft",
    blockAvgTime: 5,
    units: [
      {
        name: "SHFT",
        code: "SHFT",
        magnitude: 18,
      },
    ],
    explorerViews: [
      {
        tx: "https://bx.shyft.network/tx/$hash",
        address: "https://bx.shyft.network/address/$address",
      },
    ],
  },
  stride: {
    type: "CryptoCurrency",
    id: "stride",
    coinType: CoinType.ATOM,
    name: "Stride",
    managerAppName: "Cosmos",
    ticker: "STRD",
    scheme: "stride",
    color: "#e91179",
    family: "cosmos",
    units: [
      {
        name: "Stride",
        code: "STRD",
        magnitude: 6,
      },
      {
        name: "Micro-Stride",
        code: "ustrd",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/stride/txs/$hash",
        address: "https://www.mintscan.io/stride/validators/$address",
      },
    ],
  },
  tezos: {
    type: "CryptoCurrency",
    id: "tezos",
    coinType: CoinType.TEZOS,
    name: "Tezos",
    managerAppName: "Tezos Wallet",
    ticker: "XTZ",
    scheme: "tezos",
    color: "#007BFF",
    family: "tezos",
    blockAvgTime: 60,
    units: [
      {
        name: "XTZ",
        code: "XTZ",
        magnitude: 6,
      },
    ],
    explorerViews: [
      {
        tx: "https://tzkt.io/$hash",
        address: "https://tzkt.io/$address",
      },
    ],
  },
  thundercore: {
    type: "CryptoCurrency",
    id: "thundercore",
    coinType: CoinType.THUNDERCORE,
    name: "Thundercore",
    managerAppName: "Thundercore",
    ticker: "TT",
    scheme: "thundercore",
    color: "#0844D2",
    family: "evm",
    units: [
      {
        name: "TT",
        code: "TT",
        magnitude: 18,
      },
    ],
    explorerViews: [
      {
        tx: "https://viewblock.io/thundercore/tx/$hash",
        address: "https://viewblock.io/thundercore/address/$address",
      },
    ],
  },
  tomo: {
    type: "CryptoCurrency",
    id: "tomo",
    coinType: CoinType.TOMO,
    name: "TomoChain",
    managerAppName: "TomoChain",
    ticker: "TOMO",
    scheme: "tomo",
    color: "#FF9933",
    family: "evm",
    blockAvgTime: 2,
    units: [
      {
        name: "TOMO",
        code: "TOMO",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://scan.tomochain.com/txs/$hash",
      },
    ],
  },
  ton: {
    type: "CryptoCurrency",
    id: "ton",
    coinType: CoinType.TON,
    name: "TON",
    managerAppName: "TON",
    ticker: "TON",
    scheme: "ton",
    color: "#0098ea",
    family: "ton",
    units: [
      {
        name: "TON",
        code: "TON",
        magnitude: 9,
      },
    ],
    explorerViews: [
      {
        tx: "https://tonscan.org/tx/$hash",
        address: "https://tonscan.org/address/$address",
      },
    ],
  },
  tron: {
    type: "CryptoCurrency",
    id: "tron",
    coinType: CoinType.TRON,
    name: "Tron",
    managerAppName: "Tron",
    ticker: "TRX",
    scheme: "tron",
    color: "#D9012C",
    family: "tron",
    blockAvgTime: 3,
    units: [
      {
        name: "TRX",
        code: "TRX",
        magnitude: 6,
      },
    ],
    explorerViews: [
      {
        tx: "https://tronscan.org/#/transaction/$hash",
        address: "https://tronscan.org/#/address/$address",
      },
    ],
    keywords: ["trx", "tron"],
  },
  ubiq: {
    type: "CryptoCurrency",
    id: "ubiq",
    coinType: CoinType.UBIQ,
    name: "Ubiq",
    managerAppName: "Ubiq",
    ticker: "UBQ",
    scheme: "ubiq",
    color: "#02e785",
    family: "evm",
    blockAvgTime: 88,
    units: [
      {
        name: "ubiq",
        code: "UBQ",
        magnitude: 18,
      },
      {
        name: "Gwei",
        code: "Gwei",
        magnitude: 9,
      },
      {
        name: "Mwei",
        code: "Mwei",
        magnitude: 6,
      },
      {
        name: "Kwei",
        code: "Kwei",
        magnitude: 3,
      },
      {
        name: "wei",
        code: "wei",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://ubiqscan.io/tx/$hash",
      },
    ],
  },
  umee: {
    type: "CryptoCurrency",
    id: "umee",
    coinType: CoinType.ATOM,
    name: "Umee",
    managerAppName: "Cosmos",
    ticker: "UMEE",
    scheme: "umee",
    color: "#bb90f8",
    family: "cosmos",
    units: [
      {
        name: "Umee",
        code: "UMEE",
        magnitude: 6,
      },
      {
        name: "Micro-Umee",
        code: "uumee",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/umee/txs/$hash",
        address: "https://www.mintscan.io/umee/validators/$address",
      },
    ],
  },
  vechain: {
    type: "CryptoCurrency",
    id: "vechain",
    coinType: CoinType.VECHAIN,
    name: "Vechain",
    managerAppName: "VeChain",
    ticker: "VET",
    scheme: "vechain",
    color: "#82BE00",
    family: "vechain",
    blockAvgTime: 10,
    units: ethereumUnits("VET", "VET"),
    explorerViews: [
      {
        tx: "https://explore.vechain.org/transactions/$hash",
        address: "https://explore.vechain.org/accounts/$address",
      },
    ],
  },
  wanchain: {
    type: "CryptoCurrency",
    id: "wanchain",
    coinType: CoinType.WANCHAIN,
    name: "Wanchain",
    managerAppName: "Wanchain",
    ticker: "WAN",
    scheme: "wanchain",
    color: "#276097",
    family: "evm",
    units: [
      {
        name: "WAN",
        code: "WAN",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.wanchain.org/block/trans/$hash",
      },
    ],
  },
  waves: {
    type: "CryptoCurrency",
    id: "waves",
    coinType: CoinType.WAVES,
    name: "Waves",
    managerAppName: "Waves",
    ticker: "WAVES",
    scheme: "waves",
    color: "#004FFF",
    family: "waves",
    units: [
      {
        name: "WAVES",
        code: "WAVES",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  zcash: {
    type: "CryptoCurrency",
    id: "zcash",
    coinType: CoinType.ZCASH,
    name: "Zcash",
    managerAppName: "Zcash",
    ticker: "ZEC",
    scheme: "zcash",
    color: "#3790ca",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 0x1cb8,
      P2SH: 0x1cbd,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "zcash",
        code: "ZEC",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://blockchair.com/zcash/transaction/$hash",
        address: "https://blockchair.com/zcash/address/$address",
      },
    ],
    explorerId: "zec",
  },
  zclassic: {
    type: "CryptoCurrency",
    id: "zclassic",
    coinType: CoinType.ZCLASSIC,
    name: "ZClassic",
    managerAppName: "ZClassic",
    ticker: "ZCL",
    scheme: "zclassic",
    color: "#CF6031",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 0x1cb8,
      P2SH: 0x1cbd,
    },
    units: [
      {
        name: "zclassic",
        code: "ZCL",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://zcl.tokenview.com/en/tx/$hash",
        address: "https://zcl.tokenview.com/en/address/$address",
      },
    ],
  },
  zcoin: {
    type: "CryptoCurrency",
    id: "zcoin",
    coinType: CoinType.ZCOIN,
    name: "ZCoin",
    managerAppName: "Zcoin",
    ticker: "XZC",
    scheme: "zcoin",
    color: "#00C027",
    family: "bitcoin",
    units: [
      {
        name: "XZC",
        code: "XZC",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.zcoin.io/tx/$hash",
      },
    ],
  },
  zencash: {
    type: "CryptoCurrency",
    id: "zencash",
    coinType: CoinType.ZEN,
    name: "Horizen",
    managerAppName: "Horizen",
    ticker: "ZEN",
    scheme: "zencash",
    color: "#152f5c",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 0x2089,
      P2SH: 0x2096,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "zencash",
        code: "ZEN",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.zensystem.io/tx/$hash",
        address: "https://explorer.zensystem.io/address/$address",
      },
    ],
    explorerId: "zen",
  },
  zilliqa: {
    type: "CryptoCurrency",
    id: "zilliqa",
    coinType: CoinType.ZILLIQA,
    name: "Zilliqa",
    managerAppName: "Zilliqa",
    ticker: "ZIL",
    scheme: "zilliqa",
    color: "#2CC0BE",
    family: "zilliqa",
    units: [
      {
        name: "ZIL",
        code: "ZIL",
        magnitude: 12,
      },
    ],
    explorerViews: [
      {
        tx: "https://viewblock.io/zilliqa/tx/$hash",
        address: "https://viewblock.io/zilliqa/address/$address",
      },
    ],
  },
  // Cronos POS Chain (formerly Crypto.org)
  crypto_org: {
    type: "CryptoCurrency",
    id: "crypto_org",
    coinType: CoinType.CRYPTO_ORG,
    name: "Cronos POS Chain",
    managerAppName: "Cronos POS Chain",
    ticker: "CRO",
    scheme: "crypto_org",
    color: "#0e1c37",
    family: "cosmos",
    units: [
      {
        name: "CRO",
        code: "CRO",
        magnitude: 8,
      },
      {
        name: "basecro",
        code: "basecro",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://cronos-pos.org/explorer/tx/$hash",
        address: "https://cronos-pos.org/explorer/account/$address",
      },
    ],
  },
  // Testnets
  bitcoin_testnet: {
    type: "CryptoCurrency",
    id: "bitcoin_testnet",
    coinType: CoinType.BTC_TESTNET,
    name: "Bitcoin Testnet",
    managerAppName: "Bitcoin Test",
    ticker: "BTC",
    scheme: "testnet",
    color: "#00ff00",
    symbol: "Ƀ",
    units: bitcoinUnits.map(makeTestnetUnit),
    deviceTicker: "TEST",
    supportsSegwit: true,
    supportsNativeSegwit: true,
    isTestnetFor: "bitcoin",
    disableCountervalue: true,
    family: "bitcoin",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 111,
      P2SH: 196,
      XPUBVersion: 0x043587cf,
    },
    explorerViews: [
      {
        tx: "https://live.blockcypher.com/btc-testnet/tx/$hash",
        address: "https://live.blockcypher.com/btc-testnet/address/$address",
      },
    ],
    explorerId: "btc_testnet",
  },
  ethereum_sepolia: {
    type: "CryptoCurrency",
    id: "ethereum_sepolia",
    coinType: CoinType.ETH,
    name: "Ethereum Sepolia",
    managerAppName: "Ethereum",
    ticker: "ETH",
    deviceTicker: "ETH",
    scheme: "eth_sepolia",
    color: "#ff0000",
    units: ethereumUnits("ether", "ETH").map(makeTestnetUnit),
    isTestnetFor: "ethereum",
    disableCountervalue: true,
    family: "evm",
    blockAvgTime: 15,
    ethereumLikeInfo: {
      chainId: 11155111,
    },
    explorerViews: [
      {
        tx: "https://sepolia.etherscan.io/tx/$hash",
        address: "https://sepolia.etherscan.io/address/$address",
      },
    ],
    explorerId: "eth_sepolia",
  },
  ethereum_holesky: {
    type: "CryptoCurrency",
    id: "ethereum_holesky",
    coinType: CoinType.ETH,
    name: "Ethereum Holesky",
    managerAppName: "Ethereum",
    ticker: "ETH",
    deviceTicker: "ETH",
    scheme: "eth_holesky",
    color: "#00ff00",
    units: ethereumUnits("ether", "ETH").map(makeTestnetUnit),
    isTestnetFor: "ethereum",
    disableCountervalue: true,
    family: "evm",
    blockAvgTime: 15,
    ethereumLikeInfo: {
      chainId: 17000,
    },
    explorerViews: [
      {
        tx: "https://holesky.etherscan.io/tx/$hash",
        address: "https://holesky.etherscan.io/address/$address",
      },
    ],
    explorerId: "eth_holesky",
  },
  stacks: {
    type: "CryptoCurrency",
    id: "stacks",
    coinType: CoinType.STACKS,
    name: "Stacks",
    managerAppName: "Stacks",
    ticker: "STX",
    scheme: "stacks",
    color: "#5546ff",
    family: "stacks",
    units: [
      {
        name: "STX",
        code: "STX",
        magnitude: 6,
      },
      {
        name: "uSTX",
        code: "uSTX",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.stacks.co/txid/$hash",
        address: "https://explorer.stacks.co/address/$address",
      },
    ],
  },
  // Cronos POS Chain Croeseid (formerly Crypto.org Croeseid)
  crypto_org_croeseid: {
    type: "CryptoCurrency",
    id: "crypto_org_croeseid",
    coinType: CoinType.CRYPTO_ORG,
    name: "Cronos POS Chain Croeseid",
    managerAppName: "Cronos POS Chain Croeseid",
    ticker: "CRO",
    scheme: "crypto_org_croeseid",
    color: "#0e1c37",
    family: "cosmos",
    units: [
      {
        name: "TCRO",
        code: "tcro",
        magnitude: 8,
      },
      {
        name: "baseTCRO",
        code: "basetcro",
        magnitude: 0,
      },
    ],
    isTestnetFor: "crypto_org",
    disableCountervalue: true,
    explorerViews: [
      {
        tx: "https://cronos-pos.org/explorer/croeseid/tx/$hash",
        address: "https://cronos-pos.org/explorer/croeseid/account/$address",
      },
    ],
  },
  solana_testnet: {
    type: "CryptoCurrency",
    id: "solana_testnet",
    coinType: CoinType.SOLANA,
    name: "Solana testnet",
    managerAppName: "Solana",
    ticker: "SOL",
    scheme: "solana_testnet",
    color: "#000",
    family: "solana",
    isTestnetFor: "solana",
    disableCountervalue: true,
    units: [
      {
        name: "SOL",
        code: "SOL",
        magnitude: 9,
      },
      {
        name: "lamports",
        code: "lamports",
        magnitude: 0,
      },
    ].map(makeTestnetUnit),
    explorerViews: [
      {
        address: "https://explorer.solana.com/address/$address?cluster=testnet",
        tx: "https://explorer.solana.com/tx/$hash?cluster=testnet",
      },
      {
        address: "https://solanabeach.io/address/$address?cluster=testnet",
        tx: "https://solanabeach.io/transaction/$hash?cluster=testnet",
      },
    ],
  },
  solana_devnet: {
    type: "CryptoCurrency",
    id: "solana_devnet",
    coinType: CoinType.SOLANA,
    name: "Solana devnet",
    managerAppName: "Solana",
    ticker: "SOL",
    scheme: "solana_devnet",
    color: "#000",
    family: "solana",
    isTestnetFor: "solana",
    disableCountervalue: true,
    units: [
      {
        name: "SOL",
        code: "SOL",
        magnitude: 9,
      },
      {
        name: "lamports",
        code: "lamports",
        magnitude: 0,
      },
    ].map(makeTestnetUnit),
    explorerViews: [
      {
        address: "https://explorer.solana.com/address/$address?cluster=devnet",
        tx: "https://explorer.solana.com/tx/$hash?cluster=devnet",
      },
      {
        address: "https://solanabeach.io/address/$address?cluster=devnet",
        tx: "https://solanabeach.io/transaction/$hash?cluster=devnet",
      },
    ],
  },
  filecoin: {
    type: "CryptoCurrency",
    id: "filecoin",
    coinType: CoinType.FILECOIN,
    name: "Filecoin",
    managerAppName: "Filecoin",
    ticker: "FIL",
    scheme: "filecoin",
    color: "#0090ff",
    family: "filecoin",
    units: [
      {
        name: "FIL",
        code: "FIL",
        magnitude: 18,
      },
    ],
    explorerViews: [
      {
        tx: "https://beryx.io/v1/explore/fil/mainnet/transactions/$hash",
        address: "https://beryx.io/v1/explore/fil/mainnet/address/$address",
      },
    ],
  },
  internet_computer: {
    type: "CryptoCurrency",
    id: "internet_computer",
    coinType: CoinType.ICP,
    name: "Internet Computer",
    managerAppName: "InternetComputer",
    ticker: "ICP",
    scheme: "internet_computer",
    color: "#e1effa",
    family: "internet_computer",
    units: [
      {
        name: "ICP",
        code: "ICP",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://dashboard.internetcomputer.org/transaction/$hash",
        address: "https://dashboard.internetcomputer.org/account/$address",
      },
    ],
  },
  injective: {
    type: "CryptoCurrency",
    id: "injective",
    coinType: 60,
    name: "Injective",
    managerAppName: "Cosmos",
    ticker: "INJ",
    scheme: "injective",
    color: "#0bd",
    family: "cosmos",
    units: [
      {
        name: "Injective",
        code: "INJ",
        magnitude: 18,
      },
      {
        name: "Micro-Injective",
        code: "inj",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/injective/txs/$hash",
        address: "https://www.mintscan.io/injective/validators/$address",
      },
    ],
  },
  casper: {
    name: "Casper",
    ticker: "CSPR",
    coinType: CoinType.CSPR,
    color: "#000000",
    family: "casper",
    id: "casper",
    managerAppName: "Casper",
    scheme: "casper",
    type: "CryptoCurrency",
    explorerViews: [
      {
        tx: "https://cspr.live/deploy/$hash",
        address: "https://cspr.live/account/$address",
      },
    ],
    units: [
      {
        name: "CSPR",
        code: "CSPR",
        magnitude: 9,
      },
      {
        name: "motes",
        code: "motes",
        magnitude: 0,
      },
    ],
  },
  // ethereum nanoapp currencies
  // Light Integrations are at the end of the list until we figure out a way to fix the ticker/managerApp collisions
  arbitrum: {
    type: "CryptoCurrency",
    id: "arbitrum",
    coinType: CoinType.ETH,
    name: "Arbitrum",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "arbitrum",
    color: "#28a0f0",
    family: "evm",
    units: ethereumUnits("ETH", "ETH"),
    ethereumLikeInfo: {
      chainId: 42161,
    },
    explorerViews: [
      {
        tx: "https://arbiscan.io/tx/$hash",
        address: "https://arbiscan.io/address/$address",
        token: "https://arbiscan.io/token/$contractAddress?a=$address",
      },
    ],
  },
  arbitrum_sepolia: {
    type: "CryptoCurrency",
    id: "arbitrum_sepolia",
    coinType: CoinType.ETH,
    name: "Arbitrum Sepolia",
    managerAppName: "Ethereum",
    ticker: "ETH",
    deviceTicker: "ETH",
    scheme: "arbitrum_sepolia",
    color: "#ff0000",
    family: "evm",
    units: ethereumUnits("ether", "ETH").map(makeTestnetUnit),
    isTestnetFor: "arbitrum",
    disableCountervalue: true,
    ethereumLikeInfo: {
      chainId: 421614,
    },
    explorerViews: [
      {
        tx: "https://sepolia.arbiscan.io/tx/$hash",
        address: "https://sepolia.arbiscan.io/address/$address",
        token: "https://sepolia.arbiscan.io/token/$contractAddress?a=$address",
      },
    ],
  },
  // Cronos EVM blockchain
  cronos: {
    type: "CryptoCurrency",
    id: "cronos",
    coinType: CoinType.ETH,
    name: "Cronos",
    managerAppName: "Ethereum",
    ticker: "CRO",
    scheme: "cro",
    color: "#002D74",
    family: "evm",
    ethereumLikeInfo: {
      chainId: 25,
    },
    units: [
      {
        name: "CRO",
        code: "CRO",
        magnitude: 18,
      },
    ],
    explorerViews: [
      {
        tx: "https://cronoscan.com/tx/$hash",
        address: "https://cronoscan.com/address/$address",
        token: "https://cronoscan.com/token/$contractAddress?a=$address",
      },
    ],
  },
  fantom: {
    type: "CryptoCurrency",
    id: "fantom",
    coinType: CoinType.ETH,
    name: "Fantom",
    managerAppName: "Ethereum",
    ticker: "FTM",
    scheme: "fantom",
    color: "#1969ff",
    family: "evm",
    units: ethereumUnits("FTM", "FTM"),
    ethereumLikeInfo: {
      chainId: 250,
    },
    explorerViews: [
      {
        tx: "https://ftmscan.com/tx/$hash",
        address: "https://ftmscan.com/address/$address",
        token: "https://ftmscan.com/token/$contractAddress?a=$address",
      },
    ],
  },
  flare: {
    type: "CryptoCurrency",
    id: "flare",
    coinType: CoinType.ETH,
    name: "Flare",
    managerAppName: "Ethereum",
    ticker: "FLR",
    scheme: "flare",
    color: "#D95F6C",
    family: "evm",
    ethereumLikeInfo: {
      chainId: 14,
    },
    units: ethereumUnits("FLR", "FLR"),
    explorerViews: [
      {
        tx: "https://flare-explorer.flare.network/tx/$hash/internal-transactions",
        address: "https://flare-explorer.flare.network/address/$address/transactions",
      },
    ],
  },
  songbird: {
    type: "CryptoCurrency",
    id: "songbird",
    coinType: CoinType.ETH,
    name: "Songbird",
    managerAppName: "Ethereum",
    ticker: "SGB",
    scheme: "songbird",
    color: "#61ACD4",
    family: "evm",
    ethereumLikeInfo: {
      chainId: 19,
    },
    units: ethereumUnits("SGB", "SGB"),
    explorerViews: [
      {
        tx: "https://songbird-explorer.flare.network/tx/$hash/internal-transactions",
        address: "https://songbird-explorer.flare.network/address/$address/transactions",
      },
    ],
  },
  moonbeam: {
    type: "CryptoCurrency",
    id: "moonbeam",
    coinType: CoinType.ETH,
    name: "Moonbeam",
    managerAppName: "Ethereum",
    ticker: "GLMR",
    scheme: "moonbeam",
    color: "#958FDC",
    family: "evm",
    units: [
      {
        name: "GLMR",
        code: "GLMR",
        magnitude: 18,
      },
    ],
    ethereumLikeInfo: {
      chainId: 1284,
    },
    explorerViews: [
      {
        tx: "https://moonbeam.moonscan.io/tx/$hash",
        address: "https://moonbeam.moonscan.io/address/$address",
        token: "https://moonbeam.moonscan.io/token/$contractAddress?a=$address",
      },
    ],
  },
  rsk: {
    type: "CryptoCurrency",
    id: "rsk",
    coinType: CoinType.ETH,
    name: "RSK",
    managerAppName: "Ethereum",
    ticker: "RBTC",
    scheme: "rsk",
    color: "#FF931E",
    family: "evm",
    units: ethereumUnits("RBTC", "RBTC"),
    ethereumLikeInfo: {
      chainId: 30,
    },
    explorerViews: [
      {
        tx: "https://explorer.rsk.co/tx/$hash",
        address: "https://explorer.rsk.co/address/$address",
        token: "https://explorer.rsk.co/address/$address",
      },
    ],
  },
  bittorrent: {
    type: "CryptoCurrency",
    id: "bittorrent",
    coinType: CoinType.ETH,
    name: "Bittorent Chain",
    managerAppName: "Ethereum",
    ticker: "BTT",
    scheme: "btt",
    color: "#000000",
    family: "evm",
    units: ethereumUnits("BTT", "BTT"),
    ethereumLikeInfo: {
      chainId: 199,
    },
    explorerViews: [
      {
        tx: "https://bttcscan.com/tx/$hash",
        address: "https://bttcscan.com/address/$address",
        token: "https://bttcscan.com/token/$address",
      },
    ],
  },
  optimism: {
    type: "CryptoCurrency",
    id: "optimism",
    coinType: CoinType.ETH,
    name: "OP Mainnet",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "optimism",
    color: "#FF0421",
    family: "evm",
    units: ethereumUnits("ether", "ETH"),
    ethereumLikeInfo: {
      chainId: 10,
    },
    explorerViews: [
      {
        tx: "https://optimistic.etherscan.io/tx/$hash",
        address: "https://optimistic.etherscan.io/address/$address",
        token: "https://optimistic.etherscan.io/token/$contractAddress?a=$address",
      },
    ],
    keywords: ["optimism"],
  },
  optimism_sepolia: {
    type: "CryptoCurrency",
    id: "optimism_sepolia",
    coinType: CoinType.ETH,
    name: "OP Sepolia",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "optimism_sepolia",
    color: "#FF0000",
    family: "evm",
    units: ethereumUnits("ether", "ETH").map(makeTestnetUnit),
    isTestnetFor: "optimism",
    ethereumLikeInfo: {
      chainId: 11155420,
    },
    explorerViews: [
      {
        tx: "https://sepolia-optimism.etherscan.io/tx/$hash",
        address: "https://sepolia-optimism.etherscan.io/address/$address",
        token: "https://sepolia-optimism.etherscan.io/token/$contractAddress?a=$address",
      },
    ],
  },
  energy_web: {
    type: "CryptoCurrency",
    id: "energy_web",
    coinType: CoinType.ETH,
    name: "Energy Web",
    managerAppName: "Ethereum",
    ticker: "EWT",
    scheme: "energy_web",
    color: "#A566FF",
    family: "evm",
    units: ethereumUnits("EWT", "EWT"),
    ethereumLikeInfo: {
      chainId: 246,
    },
    explorerViews: [
      {
        tx: "https://explorer.energyweb.org/tx/$hash",
        address: "https://explorer.energyweb.org/address/$address",
        token: "https://explorer.energyweb.org/token/$contractAddress?a=$address",
      },
    ],
  },
  astar: {
    type: "CryptoCurrency",
    id: "astar",
    coinType: CoinType.ETH,
    name: "Astar",
    managerAppName: "Ethereum",
    ticker: "ASTR",
    scheme: "astar",
    color: "#06E1FF",
    family: "evm",
    units: ethereumUnits("ASTR", "ASTR"),
    ethereumLikeInfo: {
      chainId: 592,
    },
    explorerViews: [
      {
        tx: "https://blockscout.com/astar/tx/$hash",
        address: "https://blockscout.com/astar/address/$address",
        token: "https://blockscout.com/astar/token/$contractAddress?a=$address",
      },
    ],
  },
  metis: {
    type: "CryptoCurrency",
    id: "metis",
    coinType: CoinType.ETH,
    name: "Metis",
    managerAppName: "Ethereum",
    ticker: "METIS",
    scheme: "metis",
    color: "#00DACC",
    family: "evm",
    units: ethereumUnits("METIS", "METIS"),
    ethereumLikeInfo: {
      chainId: 1088,
    },
    explorerViews: [
      {
        tx: "https://andromeda-explorer.metis.io/tx/$hash",
        address: "https://andromeda-explorer.metis.io/address/$address",
        token: "https://andromeda-explorer.metis.io/token/$contractAddress?a=$address",
      },
    ],
  },
  boba: {
    type: "CryptoCurrency",
    id: "boba",
    coinType: CoinType.ETH,
    name: "Boba",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "boba",
    color: "#CBFF00",
    family: "evm",
    units: ethereumUnits("ETH", "ETH"),
    ethereumLikeInfo: {
      chainId: 288,
    },
    explorerViews: [
      {
        tx: "https://bobascan.com/tx/$hash",
        address: "https://bobascan.com/address/$address",
        token: "https://bobascan.com/token/$contractAddress?a=$address",
      },
    ],
  },
  moonriver: {
    type: "CryptoCurrency",
    id: "moonriver",
    coinType: CoinType.ETH,
    name: "Moonriver",
    managerAppName: "Ethereum",
    ticker: "MOVR",
    scheme: "moonriver",
    color: "#95F921",
    family: "evm",
    units: ethereumUnits("MOVR", "MOVR"),
    ethereumLikeInfo: {
      chainId: 1285,
    },
    explorerViews: [
      {
        tx: "https://moonriver.moonscan.io/tx/$hash",
        address: "https://moonriver.moonscan.io/address/$address",
        token: "https://moonriver.moonscan.io/token/$contractAddress?a=$address",
      },
    ],
  },
  velas_evm: {
    type: "CryptoCurrency",
    id: "velas_evm",
    coinType: CoinType.ETH,
    name: "Velas EVM",
    managerAppName: "Ethereum",
    ticker: "VLX",
    scheme: "velas",
    color: "#000000",
    family: "evm",
    units: ethereumUnits("VLX", "VLX"),
    ethereumLikeInfo: {
      chainId: 106,
    },
    explorerViews: [
      {
        tx: "https://evmexplorer.velas.com/tx/$hash",
        address: "https://evmexplorer.velas.com/address/$address",
        token: "https://evmexplorer.velas.com/token/$contractAddress?a=$address",
      },
    ],
  },
  syscoin: {
    type: "CryptoCurrency",
    id: "syscoin",
    coinType: CoinType.ETH,
    name: "Syscoin",
    managerAppName: "Ethereum",
    ticker: "SYS",
    scheme: "syscoin",
    color: "#257DB8",
    family: "evm",
    units: ethereumUnits("SYS", "SYS"),
    ethereumLikeInfo: {
      chainId: 57,
    },
    explorerViews: [
      {
        tx: "https://explorer.syscoin.org/tx/$hash",
        address: "https://explorer.syscoin.org/address/$address",
        token: "https://explorer.syscoin.org/token/$contractAddress?a=$address",
      },
    ],
  },
  telos_evm: {
    type: "CryptoCurrency",
    id: "telos_evm",
    coinType: CoinType.ETH,
    name: "Telos",
    managerAppName: "Ethereum",
    ticker: "TLOS",
    scheme: "telos_evm",
    color: "#AC72F9",
    family: "evm",
    units: ethereumUnits("TLOS", "TLOS"),
    ethereumLikeInfo: {
      chainId: 40,
    },
    explorerViews: [
      {
        tx: "https://www.teloscan.io/tx/$hash",
        address: "https://www.teloscan.io/address/$address",
        token: "https://www.teloscan.io/token/$contractAddress?a=$address",
      },
    ],
  },
  polygon_zk_evm: {
    type: "CryptoCurrency",
    id: "polygon_zk_evm",
    coinType: CoinType.ETH,
    name: "Polygon zkEVM",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "polygon_zk_evm",
    color: "#8247E5",
    family: "evm",
    units: ethereumUnits("ETH", "ETH"),
    ethereumLikeInfo: {
      chainId: 1101,
    },
    explorerViews: [
      {
        tx: "https://zkevm.polygonscan.com/tx/$hash",
        address: "https://zkevm.polygonscan.com/address/$address",
        token: "https://zkevm.polygonscan.com/token/$contractAddress?a=$address",
      },
    ],
  },
  polygon_zk_evm_testnet: {
    type: "CryptoCurrency",
    id: "polygon_zk_evm_testnet",
    coinType: CoinType.ETH,
    name: "Polygon zkEVM Testnet",
    managerAppName: "Ethereum",
    ticker: "ETH",
    deviceTicker: "ETH",
    scheme: "polygon_zk_evm_testnet",
    color: "#E58247",
    family: "evm",
    units: ethereumUnits("ETH", "ETH").map(makeTestnetUnit),
    disableCountervalue: true,
    isTestnetFor: "polygon_zk_evm",
    ethereumLikeInfo: {
      chainId: 1442,
    },
    explorerViews: [
      {
        tx: "https://testnet-zkevm.polygonscan.com/tx/$hash",
        address: "https://testnet-zkevm.polygonscan.com/address/$address",
        token: "https://testnet-zkevm.polygonscan.com/token/$contractAddress?a=$address",
      },
    ],
  },
  base: {
    type: "CryptoCurrency",
    id: "base",
    coinType: CoinType.ETH,
    name: "Base",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "base",
    color: "#1755FE",
    family: "evm",
    units: ethereumUnits("ETH", "ETH"),
    ethereumLikeInfo: {
      chainId: 8453,
    },
    explorerViews: [
      {
        tx: "https://basescan.org/tx/$hash",
        address: "https://basescan.org/address/$address",
        token: "https://basescan.org/token/$contractAddress?a=$address",
      },
    ],
  },
  base_sepolia: {
    type: "CryptoCurrency",
    id: "base_sepolia",
    coinType: CoinType.ETH,
    name: "Base Sepolia",
    managerAppName: "Ethereum",
    ticker: "ETH",
    deviceTicker: "ETH",
    scheme: "base_sepolia",
    color: "#FF0000",
    family: "evm",
    units: ethereumUnits("ETH", "ETH").map(makeTestnetUnit),
    disableCountervalue: true,
    isTestnetFor: "base",
    ethereumLikeInfo: {
      chainId: 84532,
    },
    explorerViews: [
      {
        tx: "https://sepolia.basescan.org/tx/$hash",
        address: "https://sepolia.basescan.org/address/$address",
        token: "https://sepolia.basescan.org/token/$contractAddress?a=$address",
      },
    ],
  },
  klaytn: {
    type: "CryptoCurrency",
    id: "klaytn",
    coinType: CoinType.ETH,
    name: "Klaytn",
    managerAppName: "Ethereum",
    ticker: "KLAY",
    scheme: "klaytn",
    color: "#FF8B00",
    family: "evm",
    units: ethereumUnits("KLAY", "KLAY"),
    ethereumLikeInfo: {
      chainId: 8217,
    },
    explorerViews: [
      {
        tx: "https://www.klaytnfinder.io/tx/$hash",
        address: "https://www.klaytnfinder.io/account/$address",
        token: "https://www.klaytnfinder.io/token/$address",
      },
    ],
  },
  neon_evm: {
    type: "CryptoCurrency",
    id: "neon_evm",
    coinType: CoinType.ETH,
    name: "Neon EVM",
    managerAppName: "Ethereum",
    ticker: "NEON",
    scheme: "neon_evm",
    color: "#D13BB7",
    family: "evm",
    units: ethereumUnits("NEON", "NEON"),
    ethereumLikeInfo: {
      chainId: 245022934,
    },
    explorerViews: [
      {
        tx: "https://neonscan.org/tx/$hash",
        address: "https://neonscan.org/address/$address",
        token: "https://neonscan.org/token/$address",
      },
    ],
  },
  lukso: {
    type: "CryptoCurrency",
    id: "lukso",
    coinType: CoinType.ETH,
    name: "Lukso",
    managerAppName: "Ethereum",
    ticker: "LYX",
    scheme: "lukso",
    color: "#FE0167",
    family: "evm",
    units: ethereumUnits("LYX", "LYX"),
    disableCountervalue: false,
    ethereumLikeInfo: {
      chainId: 42,
    },
    explorerViews: [
      {
        tx: "https://explorer.execution.mainnet.lukso.network/tx/$hash",
        address: "https://explorer.execution.mainnet.lukso.network/address/$address",
        token: "https://explorer.execution.mainnet.lukso.network/token/$address",
      },
    ],
  },
  linea: {
    type: "CryptoCurrency",
    id: "linea",
    coinType: CoinType.ETH,
    name: "Linea",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "linea",
    color: "#000000",
    family: "evm",
    units: ethereumUnits("ETH", "ETH"),
    disableCountervalue: false,
    ethereumLikeInfo: {
      chainId: 59144,
    },
    explorerViews: [
      {
        tx: "https://lineascan.build/tx/$hash",
        address: "https://lineascan.build/address/$address",
        token: "https://lineascan.build/token/$address",
      },
    ],
  },
  linea_sepolia: {
    type: "CryptoCurrency",
    id: "linea_sepolia",
    coinType: CoinType.ETH,
    name: "Linea Sepolia",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "linea_sepolia",
    color: "#ff0000",
    family: "evm",
    units: ethereumUnits("ETH", "ETH").map(makeTestnetUnit),
    disableCountervalue: false,
    isTestnetFor: "linea",
    ethereumLikeInfo: {
      chainId: 59141,
    },
    explorerViews: [
      {
        tx: "https://sepolia.lineascan.build/tx/$hash",
        address: "https://sepolia.lineascan.build/address/$address",
        token: "https://sepolia.lineascan.build/token/$address",
      },
    ],
  },
  blast: {
    type: "CryptoCurrency",
    id: "blast",
    coinType: CoinType.ETH,
    name: "Blast",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "blast",
    color: "#FCFC06",
    family: "evm",
    units: ethereumUnits("ETH", "ETH"),
    disableCountervalue: false,
    ethereumLikeInfo: {
      chainId: 81457,
    },
    explorerViews: [
      {
        tx: "https://blastscan.io/tx/$hash",
        address: "https://blastscan.io/address/$address",
        token: "https://blastscan.io/token/$address",
      },
    ],
  },
  blast_sepolia: {
    type: "CryptoCurrency",
    id: "blast_sepolia",
    coinType: CoinType.ETH,
    name: "Blast Sepolia",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "blast_sepolia",
    color: "#ff0000",
    family: "evm",
    units: ethereumUnits("ETH", "ETH").map(makeTestnetUnit),
    disableCountervalue: false,
    isTestnetFor: "blast",
    ethereumLikeInfo: {
      chainId: 168587773,
    },
    explorerViews: [
      {
        tx: "https://testnet.blastscan.io/tx/$hash",
        address: "https://testnet.blastscan.io/address/$address",
        token: "https://testnet.blastscan.io/token/$address",
      },
    ],
  },
  scroll: {
    type: "CryptoCurrency",
    id: "scroll",
    coinType: CoinType.ETH,
    name: "Scroll",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "scroll",
    color: "#ebc28e",
    family: "evm",
    units: ethereumUnits("ETH", "ETH"),
    disableCountervalue: false,
    ethereumLikeInfo: {
      chainId: 534352,
    },
    explorerViews: [
      {
        tx: "https://scrollscan.com/tx/$hash",
        address: "https://scrollscan.com/address/$address",
        token: "https://scrollscan.com/token/$address",
      },
    ],
  },
  scroll_sepolia: {
    type: "CryptoCurrency",
    id: "scroll_sepolia",
    coinType: CoinType.ETH,
    name: "Scroll Sepolia",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "scroll_sepolia",
    color: "#ff0000",
    family: "evm",
    units: ethereumUnits("ETH", "ETH").map(makeTestnetUnit),
    disableCountervalue: false,
    isTestnetFor: "scroll",
    ethereumLikeInfo: {
      chainId: 534351,
    },
    explorerViews: [
      {
        tx: "https://sepolia.scrollscan.dev/tx/$hash",
        address: "https://sepolia.scrollscan.dev/address/$address",
        token: "https://sepolia.scrollscan.dev/token/$address",
      },
    ],
  },
  etherlink: {
    type: "CryptoCurrency",
    id: "etherlink",
    coinType: CoinType.ETH,
    name: "Etherlink",
    managerAppName: "Ethereum",
    ticker: "XTZ",
    scheme: "etherlink",
    color: "#38FF9C",
    family: "evm",
    units: ethereumUnits("XTZ", "XTZ"),
    ethereumLikeInfo: {
      chainId: 42793,
    },
    explorerViews: [
      {
        tx: "https://explorer.etherlink.com/tx/$hash",
        address: "https://explorer.etherlink.com/address/$address",
        token: "https://explorer.etherlink.com/token/$contractAddress?a=$address",
      },
    ],
  },
  zksync: {
    type: "CryptoCurrency",
    id: "zksync",
    coinType: CoinType.ETH,
    name: "ZKsync",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "zksync",
    color: "#000000",
    family: "evm",
    units: ethereumUnits("ETH", "ETH"),
    ethereumLikeInfo: {
      chainId: 324,
    },
    explorerViews: [
      {
        tx: "https://explorer.zksync.io/tx/$hash",
        address: "https://explorer.zksync.io/address/$address",
        token: "https://explorer.zksync.io/token/$contractAddress?a=$address",
      },
    ],
  },
  zksync_sepolia: {
    type: "CryptoCurrency",
    id: "zksync_sepolia",
    coinType: CoinType.ETH,
    name: "ZKsync Sepolia",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "zksync_sepolia",
    color: "#ff0000",
    family: "evm",
    units: ethereumUnits("ETH", "ETH").map(makeTestnetUnit),
    ethereumLikeInfo: {
      chainId: 300,
    },
    explorerViews: [
      {
        tx: "https://sepolia-era.zksync.network/tx/$hash",
        address: "https://sepolia-era.zksync.network/address/$address",
        token: "https://sepolia-era.zksync.network/token/$contractAddress?a=$address",
      },
    ],
  },
  // Keep it at the bottom
  // Tickers dup
  binance_beacon_chain: {
    type: "CryptoCurrency",
    id: "binance_beacon_chain",
    coinType: CoinType.ATOM,
    name: "BinanceBeaconChain",
    managerAppName: "Cosmos",
    ticker: "BNB",
    scheme: "BinanceBeaconChain",
    color: "#f0b90b",
    family: "cosmos",
    units: [
      {
        name: "BNB",
        code: "BNB",
        magnitude: 6,
      },
      {
        name: "Micro-BNB",
        code: "ubnb",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://binance.mintscan.io/txs/$hash",
        address: "https://binance.mintscan.io/validators/$address",
      },
    ],
  },
  mantra: {
    type: "CryptoCurrency",
    id: "mantra",
    coinType: CoinType.ATOM,
    name: "Mantra",
    managerAppName: "Cosmos",
    ticker: "OM",
    scheme: "mantra",
    color: "#ffb386",
    family: "cosmos",
    units: [
      {
        name: "Mantra",
        code: "OM",
        magnitude: 6,
      },
      {
        name: "Micro-Mantra",
        code: "uom",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/mantra/txs/$hash",
        address: "https://www.mintscan.io/mantra/validators/$address",
      },
    ],
  },
};

const cryptocurrenciesByScheme: Record<string, CryptoCurrency> = {};
const cryptocurrenciesByTicker: Record<string, CryptoCurrency> = {};
const cryptocurrenciesArray: CryptoCurrency[] = [];
const prodCryptoArray: CryptoCurrency[] = [];
const cryptocurrenciesArrayWithoutTerminated: CryptoCurrency[] = [];
const prodCryptoArrayWithoutTerminated: CryptoCurrency[] = [];

for (const cryptoCurrency of Object.values(cryptocurrenciesById)) {
  registerCryptoCurrency(cryptoCurrency);
}

/**
 *
 * @param {string} id
 * @param {CryptoCurrency} currency
 */
export function registerCryptoCurrency(currency: CryptoCurrency): void {
  cryptocurrenciesById[currency.id] = currency;
  cryptocurrenciesByScheme[currency.scheme] = currency;

  if (!currency.isTestnetFor) {
    const currencyAlreadySet = cryptocurrenciesByTicker[currency.ticker];
    const curencyHasTickerinKeywords = Boolean(currency?.keywords?.includes(currency.ticker));

    if (
      !currencyAlreadySet ||
      // In case of duplicates, we prioritize currencies with the ticker as a keyword of the currency
      (currencyAlreadySet && curencyHasTickerinKeywords)
    ) {
      cryptocurrenciesByTicker[currency.ticker] = currency;
    }
    prodCryptoArray.push(currency);

    if (!currency.terminated) {
      prodCryptoArrayWithoutTerminated.push(currency);
    }
  }

  cryptocurrenciesArray.push(currency);

  if (!currency.terminated) {
    cryptocurrenciesArrayWithoutTerminated.push(currency);
  }
}

/**
 *
 * @param {*} withDevCrypto
 * @param {*} withTerminated
 */
export function listCryptoCurrencies(
  withDevCrypto = false,
  withTerminated = false,
): CryptoCurrency[] {
  return withTerminated
    ? withDevCrypto
      ? cryptocurrenciesArray
      : prodCryptoArray
    : withDevCrypto
      ? cryptocurrenciesArrayWithoutTerminated
      : prodCryptoArrayWithoutTerminated;
}

/**
 *
 * @param {*} f
 */
export function findCryptoCurrency(
  f: (arg0: CryptoCurrency) => boolean,
): CryptoCurrency | null | undefined {
  return cryptocurrenciesArray.find(f);
}

/**
 *
 * @param {*} scheme
 */
export function findCryptoCurrencyByScheme(scheme: string): CryptoCurrency | null | undefined {
  return cryptocurrenciesByScheme[scheme];
}

/**
 *
 * @param {*} ticker
 */
export function findCryptoCurrencyByTicker(ticker: string): CryptoCurrency | null | undefined {
  return cryptocurrenciesByTicker[ticker];
}

export function findCryptoCurrencyById(id: string): CryptoCurrency | undefined {
  return cryptocurrenciesById[id];
}

const testsMap = {
  keywords: s =>
    findCryptoCurrency(c =>
      Boolean(c?.keywords?.map(k => k.replace(/ /, "").toLowerCase()).includes(s)),
    ),
  name: s => findCryptoCurrency(c => c.name.replace(/ /, "").toLowerCase() === s),
  id: s => findCryptoCurrencyById(s.toLowerCase()),
  ticker: s => findCryptoCurrencyByTicker(s.toUpperCase()),
  manager: s => findCryptoCurrencyByManagerAppName(s),
};

/**
 *
 * @param {*} keyword
 */
export const findCryptoCurrencyByKeyword = (
  keyword: string,
  tests = ["keywords", "name", "id", "ticker", "manager"],
): CryptoCurrency | null | undefined => {
  const search = keyword.replace(/ /, "").toLowerCase();

  const conditions: Array<(string) => CryptoCurrency | null | undefined> = tests.map(
    t => testsMap[t],
  );

  for (const condition of conditions) {
    const currency = condition(search);

    if (currency) {
      return currency;
    }
  }
};

export const findCryptoCurrencyByManagerAppName = (
  managerAppName: string,
): CryptoCurrency | null | undefined => {
  const search = managerAppName.replace(/ /, "").toLowerCase();

  return (
    findCryptoCurrency(c => c.managerAppName === managerAppName) ||
    findCryptoCurrency(c =>
      Boolean(c.managerAppName && c.managerAppName.replace(/ /, "").toLowerCase() === search),
    )
  );
};

/**
 *
 * @param {*} id
 */
export const hasCryptoCurrencyId = (id: string): boolean => id in cryptocurrenciesById;

export function getCryptoCurrencyById(id: string): CryptoCurrency {
  const currency = findCryptoCurrencyById(id);

  if (!currency) {
    throw new Error(`currency with id "${id}" not found`);
  }

  return currency;
}
