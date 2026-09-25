import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

const bitcoinConfig: Record<string, ConfigInfo> = {
  config_currency_bitcoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Bitcoin",
      unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
    },
  },
  config_currency_bitcoin_cash: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Bitcoin Cash",
      unit: { name: "bitcoin cash", code: "BCH", magnitude: 8 },
    },
  },
  config_currency_bitcoin_gold: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Bitcoin Gold",
      unit: { name: "bitcoin gold", code: "BTG", magnitude: 8 },
    },
  },
  config_currency_bitcoin_private: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Bitcoin Private",
      unit: { name: "bitcoin private", code: "BTCP", magnitude: 8 },
    },
  },
  config_currency_dash: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Dash",
      unit: { name: "dash", code: "DASH", magnitude: 8 },
    },
  },
  config_currency_decred: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Decred",
      unit: { name: "decred", code: "DCR", magnitude: 8 },
    },
  },
  config_currency_digibyte: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "DigiByte",
      unit: { name: "digibyte", code: "DGB", magnitude: 8 },
    },
  },
  config_currency_dogecoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Dogecoin",
      unit: { name: "dogecoin", code: "DOGE", magnitude: 8 },
    },
  },
  config_currency_game_credits: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "GameCredits",
      unit: { name: "GAME", code: "GAME", magnitude: 8 },
    },
  },
  config_currency_gochain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "GoChain",
      unit: { name: "GO", code: "GO", magnitude: 8 },
    },
  },
  config_currency_komodo: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Komodo",
      unit: { name: "komodo", code: "KMD", magnitude: 8 },
    },
  },
  config_currency_lbry: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "LBRY",
      unit: { name: "LBRY", code: "LBRY", magnitude: 8 },
    },
  },
  config_currency_litecoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Litecoin",
      unit: { name: "litecoin", code: "LTC", magnitude: 8 },
    },
  },
  config_currency_nix: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Nix",
      unit: { name: "nix", code: "NIX", magnitude: 8 },
    },
  },
  config_currency_qtum: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Qtum",
      unit: { name: "qtum", code: "QTUM", magnitude: 8 },
    },
  },
  config_currency_ravencoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Ravencoin",
      unit: { name: "RVN", code: "RVN", magnitude: 8 },
    },
  },
  config_currency_resistance: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Resistance",
      unit: { name: "RES", code: "RES", magnitude: 8 },
    },
  },
  config_currency_zcash: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Zcash",
      unit: { name: "zcash", code: "ZEC", magnitude: 8 },
    },
  },
  config_currency_zclassic: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "ZClassic",
      unit: { name: "zclassic", code: "ZCL", magnitude: 8 },
    },
  },
  config_currency_zcoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "ZCoin",
      unit: { name: "XZC", code: "XZC", magnitude: 8 },
    },
  },
  config_currency_zencash: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Horizen",
      unit: { name: "zencash", code: "ZEN", magnitude: 8 },
    },
  },
};

export { bitcoinConfig };
