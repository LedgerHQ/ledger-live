import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

type CosmosConfig = Record<string, ConfigInfo>;

export const cosmosConfig: CosmosConfig = {
  config_currency_axelar: {
    type: "object",
    default: {
      lcd: "https://axelar-rest.publicnode.com",
      minGasPrice: 0.07,
      ledgerValidator: "axelarvaloper1fgklp9hemczlwtqp9jqzq3xahh38hznx7vd805",
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", type: "active" },
          { id: "staking_txs", type: "active" },
        ],
      },
    },
  },
  config_currency_cosmos: {
    type: "object",
    default: {
      lcd: "https://cosmoshub4.coin.ledger.com",
      minGasPrice: 0.025,
      ledgerValidator: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", type: "active" },
          { id: "staking_txs", type: "active" },
        ],
      },
    },
  },
  config_currency_desmos: {
    type: "object",
    default: {
      lcd: "https://api.mainnet.desmos.network",
      minGasPrice: 0.0025,
    },
  },
  config_currency_dydx: {
    type: "object",
    default: {
      lcd: "https://dydx.coin.ledger.com",
      minGasPrice: 12500000000,
      ledgerValidator: "dydxvaloper1gffkd68xcnfpzcsplf0fsuetxkysunud6a900w",
      status: {
        type: "active",
      },
    },
  },
  config_currency_nyx: {
    type: "object",
    default: {
      lcd: "https://api.nyx.nodes.guru",
      minGasPrice: 0,
      status: {
        type: "active",
      },
    },
  },
  config_currency_onomy: {
    type: "object",
    default: {
      lcd: "https://rest-mainnet.onomy.io",
      minGasPrice: 0.003,
      ledgerValidator: "onomyvaloper1fgklp9hemczlwtqp9jqzq3xahh38hznxu9mtmf",
      status: {
        type: "active",
      },
    },
  },
  config_currency_osmo: {
    type: "object",
    default: {
      lcd: "https://osmo.coin.ledger.com",
      minGasPrice: 0.04,
      ledgerValidator: "osmovaloper17cp6fxccqxrpj4zc00w2c7u6y0umc2jajsyc5t",
      status: {
        type: "active",
      },
    },
  },
  config_currency_persistence: {
    type: "object",
    default: {
      lcd: "https://rest.core.persistence.one",
      minGasPrice: 0.025,
      status: {
        type: "active",
      },
    },
  },
  config_currency_quicksilver: {
    type: "object",
    default: {
      lcd: "https://lcd.quicksilver.zone",
      minGasPrice: 0.0025,
      status: {
        type: "active",
      },
    },
  },
  config_currency_secret_network: {
    type: "object",
    default: {
      lcd: "https://lcd.mainnet.secretsaturn.net",
      minGasPrice: 0.25,
      status: {
        type: "active",
      },
    },
  },
  config_currency_stargaze: {
    type: "object",
    default: {
      lcd: "https://stargaze-api.polkachu.com",
      minGasPrice: 1,
      status: {
        type: "active",
      },
    },
  },
  config_currency_umee: {
    type: "object",
    default: {
      lcd: "https://umee-api.polkachu.com",
      minGasPrice: 0.1,
      status: {
        type: "active",
      },
    },
  },
  config_currency_coreum: {
    type: "object",
    default: {
      lcd: "https://full-node.mainnet-1.coreum.dev:1317",
      minGasPrice: 0.1,
      status: {
        type: "active",
      },
    },
  },
  config_currency_injective: {
    type: "object",
    default: {
      lcd: "https://injective-rest.publicnode.com",
      minGasPrice: 900000000,
      ledgerValidator: "injvaloper1ntn4j2lsu3k60g8xj9pqshqvdj2q5tygyvczpy",
      status: {
        type: "active",
      },
    },
  },
  config_currency_mantra: {
    type: "object",
    default: {
      lcd: "https://api.mantrachain.io",
      minGasPrice: 0.01,
      ledgerValidator: "mantravaloper13cyn4zgugjz7pta8s7wkrxqp4cdrp7ygeem3fq",
      status: {
        type: "active",
      },
    },
  },
  config_currency_crypto_org: {
    type: "object",
    default: {
      lcd: "https://rest.cosmos.directory/cryptoorgchain",
      minGasPrice: 0.025,
      status: {
        type: "active",
      },
    },
  },
  config_currency_xion: {
    type: "object",
    default: {
      lcd: "https://xion-api.polkachu.com",
      minGasPrice: 0.04,
      ledgerValidator: "xionvaloper1t8ysd9cg6s38ak9xfadkjtvfv9uczvrn8wzv77",
      status: {
        type: "active",
      },
    },
  },
  config_currency_zenrock: {
    type: "object",
    default: {
      lcd: "https://api.diamond.zenrocklabs.io",
      minGasPrice: 2.5,
      status: {
        type: "active",
      },
    },
  },
  config_currency_babylon: {
    type: "object",
    default: {
      lcd: "https://babylon.nodes.guru/api",
      minGasPrice: 0.002, // source: https://www.mintscan.io/babylon/parameters
      status: {
        type: "active",
      },
      disableDelegation: true,
    },
  },
};

export type CosmosCoinConfig = CurrencyConfig & CosmosConfig;
const coinConfig = buildCoinConfig<CosmosCoinConfig>();
export default coinConfig;
