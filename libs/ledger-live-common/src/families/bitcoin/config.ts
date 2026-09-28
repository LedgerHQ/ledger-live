import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

const bitcoinConfig: Record<string, ConfigInfo> = {
  config_currency_bitcoin: {
    type: "object",
    default: {
      explorerId: "btc",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_bitcoin_cash: {
    type: "object",
    default: {
      explorerId: "bch",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_bitcoin_gold: {
    type: "object",
    default: {
      explorerId: "btg",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_bitcoin_private: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_bitcoin_regtest: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_bitcoin_testnet: {
    type: "object",
    default: {
      explorerId: "btc_testnet",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_dash: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_decred: {
    type: "object",
    default: {
      explorerId: "dcr",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
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
    },
  },
  config_currency_game_credits: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_gochain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_komodo: {
    type: "object",
    default: {
      explorerId: "kmd",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_lbry: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
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
    },
  },
  config_currency_nix: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_qtum: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_ravencoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_resistance: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_zcash: {
    type: "object",
    default: {
      explorerId: "zec",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_zcash_regtest: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_zclassic: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_zcoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
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
    },
  },
};

export { bitcoinConfig };
