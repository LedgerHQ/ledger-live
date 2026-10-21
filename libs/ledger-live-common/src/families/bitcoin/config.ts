import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

const bitcoinConfig: Record<string, ConfigInfo> = {
  config_currency_bitcoin: {
    type: "object",
    default: {
      transaction: { version: 2, signalsRbf: true },
      explorerId: "btc",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Bitcoin",
      unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
      // Web3checks chain id (provisional in the spec); the check runs once `url` is set remotely
      transactionChecks: {
        chainId: 1000,
        url: "https://global.api.prd.ledger.com/transaction-checks/v3",
      },
    },
  },
  config_currency_bitcoin_cash: {
    type: "object",
    default: {
      transaction: { additionals: ["bip143"] },
      addressFormat: "cashaddr",
      explorerId: "bch",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Bitcoin Cash",
      unit: { name: "bitcoin cash", code: "BCH", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
  config_currency_bitcoin_gold: {
    type: "object",
    default: {
      transaction: { additionals: ["bip143"] },
      explorerId: "btg",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Bitcoin Gold",
      unit: { name: "bitcoin gold", code: "BTG", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
  config_currency_bitcoin_regtest: {
    type: "object",
    default: {
      transaction: { version: 2, signalsRbf: true },
      explorerId: "btc_regtest",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Bitcoin Regtest",
      unit: { name: "bitcoin", code: "𝚝BTC", magnitude: 8 },
      explorer: { url: "http://localhost:9876" },
    },
  },
  config_currency_bitcoin_testnet: {
    type: "object",
    default: {
      transaction: { version: 2, signalsRbf: true },
      explorerId: "btc_testnet",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Bitcoin Testnet",
      unit: { name: "bitcoin", code: "𝚝BTC", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
      // Web3checks chain id (provisional in the spec); the check runs once `url` is set remotely
      transactionChecks: {
        chainId: 1001,
        url: "https://global.api.prd.ledger.com/transaction-checks/v3",
      },
    },
  },
  config_currency_dash: {
    type: "object",
    default: {
      explorerId: "dash",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Dash",
      unit: { name: "dash", code: "DASH", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
  config_currency_decred: {
    type: "object",
    default: {
      transaction: { expiryHeight: true },
      explorerId: "dcr",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Decred",
      unit: { name: "decred", code: "DCR", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
  config_currency_digibyte: {
    type: "object",
    default: {
      explorerId: "dgb",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "DigiByte",
      unit: { name: "digibyte", code: "DGB", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
  config_currency_dogecoin: {
    type: "object",
    default: {
      explorerId: "doge",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Dogecoin",
      unit: { name: "dogecoin", code: "DOGE", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
  config_currency_komodo: {
    type: "object",
    default: {
      transaction: {
        expiryHeight: true,
        extraData: true,
        interestLockTime: true,
        additionals: ["sapling"],
      },
      explorerId: "kmd",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Komodo",
      unit: { name: "komodo", code: "KMD", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
  config_currency_litecoin: {
    type: "object",
    default: {
      explorerId: "ltc",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Litecoin",
      unit: { name: "litecoin", code: "LTC", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
  config_currency_qtum: {
    type: "object",
    default: {
      explorerId: "qtum",
      transaction: { version: 2 },
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Qtum",
      unit: { name: "qtum", code: "QTUM", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
  config_currency_zencash: {
    type: "object",
    default: {
      explorerId: "zen",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Horizen",
      unit: { name: "zencash", code: "ZEN", magnitude: 8 },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
};

export { bitcoinConfig };
