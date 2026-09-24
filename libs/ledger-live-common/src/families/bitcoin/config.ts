import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

// Ledger explorer the UTXO currencies read their history from.
const LEDGER_EXPLORER = "https://explorers.api.live.ledger.com";

const bitcoinConfig: Record<string, ConfigInfo> = {
  config_currency_bitcoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_bitcoin_cash: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_bitcoin_gold: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_bitcoin_private: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_bitcoin_regtest: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: "http://localhost:9876" },
    },
  },
  config_currency_bitcoin_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_dash: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_decred: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_digibyte: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_dogecoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_game_credits: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
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
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_lbry: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_litecoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_nix: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_qtum: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_ravencoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_resistance: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_zcash: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: {
        EXPLORER: LEDGER_EXPLORER,
        ZCASH_GRPC_URL: "https://zec-indexer.coin.ledger.com",
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
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_zcoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
  config_currency_zencash: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: { EXPLORER: LEDGER_EXPLORER },
    },
  },
};

export { bitcoinConfig };
