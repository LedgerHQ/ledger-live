import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const IDS = [
  "bitcoin",
  "ethereum",
  "ethereum/erc20/usd_tether__erc20_",
  "bsc",
  "ripple",
  "ethereum/erc20/usd__coin",
  "solana",
  "cardano",
  "dogecoin",
  "tron",
  "ethereum/erc20/tontoken",
  "ethereum/erc20/link_chainlink",
  "polygon",
  "polkadot",
  "ethereum/erc20/wrapped_bitcoin",
  "ethereum/erc20/dai_stablecoin_v2_0",
  "litecoin",
  "bitcoin_cash",
  "ethereum/erc20/shiba_inu",
  "avalanche_c_chain",
  "ethereum/erc20/leo_token",
  "stellar",
  "ethereum/erc20/trueusd",
  "monero",
  "cosmos",
  "ethereum/erc20/okb",
  "ethereum_classic",
  "ethereum/erc20/uniswap",
  "ethereum/erc20/binance_usd",
  "near",
  "injective",
  "elrond", // NOTE: legacy 'multiversx' name, kept for compatibility
  "tezos",
  "celo",
  "osmo",
  "axelar",
  "persistence",
  "onomy",
  "mantra",
  "crypto_org",
  "xion",
  "zenrock",
  "babylon",
];

export const CURRENCIES_LIST: CryptoCurrency[] = [
  {
    type: "CryptoCurrency",
    id: "axelar",
    coinType: 118,
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
  {
    type: "CryptoCurrency",
    id: "onomy",
    coinType: 118,
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
  {
    type: "CryptoCurrency",
    id: "quicksilver",
    coinType: 118,
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
  {
    type: "CryptoCurrency",
    id: "persistence",
    coinType: 118,
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
  {
    type: "CryptoCurrency",
    id: "ethereum",
    coinType: 60,
    name: "Ethereum",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "ethereum",
    color: "#0ebdcd",
    symbol: "Ξ",
    family: "evm",
    blockAvgTime: 15,
    units: [
      {
        name: "ether",
        code: "ETH",
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
  {
    type: "CryptoCurrency",
    id: "polkadot",
    coinType: 354,
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
  {
    type: "CryptoCurrency",
    id: "solana",
    coinType: 501,
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
  {
    type: "CryptoCurrency",
    id: "cosmos",
    coinType: 118,
    name: "Cosmos",
    managerAppName: "Cosmos",
    ticker: "ATOM",
    scheme: "cosmos",
    color: "#16192f",
    family: "cosmos",
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
  {
    type: "CryptoCurrency",
    id: "celo",
    coinType: 52752,
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
  {
    type: "CryptoCurrency",
    id: "tezos",
    coinType: 1729,
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
  {
    type: "CryptoCurrency",
    // id: "multiversx",
    id: "elrond",
    coinType: 508,
    name: "MultiversX",
    managerAppName: "MultiversX",
    ticker: "EGLD",
    scheme: "multiversx",
    color: "#23F7DD",
    family: "multiversx",
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
        tx: "https://explorer.multiversx.com/transactions/$hash",
        address: "https://explorer.multiversx.com/accounts/$address",
      },
    ],
    keywords: ["multiversx"],
  },
  {
    type: "CryptoCurrency",
    id: "cardano",
    coinType: 1815,
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
  {
    type: "CryptoCurrency",
    id: "osmo",
    coinType: 118,
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
  {
    type: "CryptoCurrency",
    id: "near",
    coinType: 397,
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
  {
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
  {
    type: "CryptoCurrency",
    id: "mantra",
    coinType: 118,
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
  {
    type: "CryptoCurrency",
    id: "crypto_org",
    coinType: 394,
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
        name: "Micro-CRO",
        code: "baseCRO",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/crypto-org/tx/$hash",
        address: "https://www.mintscan.io/crypto-org/validators/$address",
      },
    ],
  },
  {
    type: "CryptoCurrency",
    id: "xion",
    coinType: 118,
    name: "Xion",
    managerAppName: "Cosmos",
    ticker: "XION",
    scheme: "xion",
    color: "#000000",
    family: "cosmos",
    units: [
      {
        name: "Xion",
        code: "XION",
        magnitude: 6,
      },
      {
        name: "Micro-XION",
        code: "uxion",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/xion/txs/$hash",
        address: "https://www.mintscan.io/xion/validators/$address",
      },
    ],
  },
  {
    type: "CryptoCurrency",
    id: "zenrock",
    coinType: 118,
    name: "Zenrock",
    managerAppName: "Cosmos",
    ticker: "ROCK",
    scheme: "zenrock",
    color: "#000000",
    family: "cosmos",
    units: [
      {
        name: "Zenrock",
        code: "ROCK",
        magnitude: 6,
      },
      {
        name: "Micro-Zenrock",
        code: "urock",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.diamond.zenrocklabs.io/transactions/$hash",
        address: "https://explorer.diamond.zenrocklabs.io/validators/$address",
      },
    ],
  },
  {
    type: "CryptoCurrency",
    id: "babylon",
    coinType: 118,
    name: "Babylon",
    managerAppName: "Cosmos",
    ticker: "BABY",
    scheme: "babylon",
    color: "#CE6533",
    family: "cosmos",
    units: [
      {
        name: "Babylon",
        code: "BABY",
        magnitude: 6,
      },
      {
        name: "micro BBN",
        code: "ubbn",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/babylon/txs/$hash",
        address: "https://www.mintscan.io/babylon/validators/$address",
      },
    ],
  },
];
