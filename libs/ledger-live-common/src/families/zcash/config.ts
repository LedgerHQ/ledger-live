import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

const zcashConfig: Record<string, ConfigInfo> = {
  config_currency_zcash: {
    type: "object",
    default: {
      explorerId: "zec",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Zcash",
      unit: { name: "zcash", code: "ZEC", magnitude: 8 },
      zaino: { url: "https://zec-indexer.coin.ledger.com" },
      explorer: { url: "https://explorers.api.live.ledger.com" },
    },
  },
  config_currency_zcash_regtest: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Zcash Regtest",
      unit: { name: "zcash", code: "𝚝ZEC", magnitude: 8 },
    },
  },
  config_currency_zcash_testnet: {
    type: "object",
    default: {
      explorerId: "zec_testnet",
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Zcash Testnet",
      unit: { name: "zcash", code: "𝚝ZEC", magnitude: 8 },
      zaino: { url: "https://testnet.zec.rocks:443" },
      explorer: { url: "https://explorers.api.live.ledger-test.com" },
    },
  },
};

export { zcashConfig };
