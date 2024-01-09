export default {
  config_currency_axelar: {
    type: "object",
    default: {
      lcd: "https://axelar-api.polkachu.com",
      minGasPrice: 0.07,
      ledgerValidator: "axelarvaloper1fgklp9hemczlwtqp9jqzq3xahh38hznx7vd805",
    },
  },
  config_currency_cosmos: {
    type: "object",
    default: {
      lcd: "https://cosmoshub4.coin.ledger.com",
      ledgerValidator: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
      minGasPrice: 0.025,
    },
  },
  config_currency_desmos: {
    type: "object",
    default: {
      lcd: "https://desmos-api.ibs.team",
      minGasPrice: 0.0025,
    },
  },
  config_currency_dydx: {
    type: "object",
    default: {
      lcd: "https://api.dydx.nodestake.top:443",
      minGasPrice: 12500000000,
      ledgerValidator: "dydxvaloper1gffkd68xcnfpzcsplf0fsuetxkysunud6a900w",
    },
  },
  config_currency_nyx: {
    type: "object",
    default: {
      lcd: "https://api.nyx.nodes.guru",
      minGasPrice: 0,
    },
  },
  config_currency_onomy: {
    type: "object",
    default: {
      lcd: "https://rest-mainnet.onomy.io",
      minGasPrice: 0.003,
      ledgerValidator: "onomyvaloper1fgklp9hemczlwtqp9jqzq3xahh38hznxu9mtmf",
    },
  },
  config_currency_osmo: {
    type: "object",
    default: {
      lcd: "https://osmosis-api.polkachu.com",
      ledgerValidator: "osmovaloper17cp6fxccqxrpj4zc00w2c7u6y0umc2jajsyc5t",
      minGasPrice: 0.025,
    },
  },
  config_currency_persistence: {
    type: "object",
    default: {
      lcd: "https://rest.core.persistence.one",
      minGasPrice: 0.025,
      ledgerValidator: "persistencevaloper1fgklp9hemczlwtqp9jqzq3xahh38hznxatty38",
    },
  },
  config_currency_quicksilver: {
    type: "object",
    default: {
      lcd: "https://lcd.quicksilver.zone",
      minGasPrice: 0.0025,
      ledgerValidator: "quickvaloper1fgklp9hemczlwtqp9jqzq3xahh38hznx02n4pp",
    },
  },
  config_currency_secret_network: {
    type: "object",
    default: {
      lcd: "https://lcd.secret.express",
      minGasPrice: 0.25,
    },
  },
  config_currency_sei_network: {
    type: "object",
    default: {
      lcd: "https://sei-api.polkachu.com",
      minGasPrice: 0.1,
    },
  },
  config_currency_stargaze: {
    type: "object",
    default: {
      lcd: "https://stargaze-api.polkachu.com",
      minGasPrice: 1,
    },
  },
  config_currency_umee: {
    type: "object",
    default: {
      lcd: "https://umee-api.polkachu.com",
      minGasPrice: 0.1,
    },
  },
  config_currency_coreum: {
    type: "object",
    default: {
      lcd: "https://full-node.mainnet-1.coreum.dev:1317",
      minGasPrice: 0.1,
    },
  },
  config_currency_injective: {
    type: "object",
    default: {
      lcd: "https://injective-api.polkachu.com",
      minGasPrice: 900000000,
      ledgerValidator: "injvaloper1ntn4j2lsu3k60g8xj9pqshqvdj2q5tygyvczpy",
    },
  },
};
