import { CosmosCurrencyConfig } from "../families/cosmos/types";

const defaultConfig = {
  config: {
    cosmos: {
      axelar: {
        lcd: "https://axelar-api.polkachu.com",
        minGasPrice: 0.07,
        ledgerValidator: "axelarvaloper1fgklp9hemczlwtqp9jqzq3xahh38hznx7vd805",
      },
      cosmos: {
        lcd: "https://cosmoshub4.coin.ledger.com",
        ledgerValidator: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
        minGasPrice: 0.025,
      },
      desmos: {
        lcd: "https://desmos-api.ibs.team",
        minGasPrice: 0.0025,
      },
      dydx: {
        lcd: "https://dydx-testnet-archive.allthatnode.com:1317",
        minGasPrice: 0.0025,
      },
      nyx: {
        lcd: "https://api.nyx.nodes.guru",
        minGasPrice: 0,
      },
      onomy: {
        lcd: "https://rest-mainnet.onomy.io",
        minGasPrice: 0.003,
        ledgerValidator: "onomyvaloper1fgklp9hemczlwtqp9jqzq3xahh38hznxu9mtmf",
      },
      osmo: {
        lcd: "https://osmosis-api.polkachu.com",
        ledgerValidator: "osmovaloper17cp6fxccqxrpj4zc00w2c7u6y0umc2jajsyc5t",
        minGasPrice: 0.025,
      },
      persistence: {
        lcd: "https://rest.core.persistence.one",
        minGasPrice: 0.025,
        ledgerValidator: "persistencevaloper1fgklp9hemczlwtqp9jqzq3xahh38hznxatty38",
      },
      quicksilver: {
        lcd: "https://lcd.quicksilver.zone",
        minGasPrice: 0.0025,
        ledgerValidator: "quickvaloper1fgklp9hemczlwtqp9jqzq3xahh38hznx02n4pp",
      },
      secret_network: {
        lcd: "https://lcd.secret.express",
        minGasPrice: 0.25,
      },
      sei_network: {
        lcd: "https://sei-api.polkachu.com",
        minGasPrice: 0.1,
      },
      stargaze: {
        lcd: "https://stargaze-api.polkachu.com",
        minGasPrice: 1,
      },
      umee: {
        lcd: "https://umee-api.polkachu.com",
        minGasPrice: 0.1,
      },
      coreum: {
        lcd: "https://full-node.mainnet-1.coreum.dev:1317",
        minGasPrice: 0.1,
      },
      injective: {
        lcd: "https://injective-api.polkachu.com",
        minGasPrice: 900000000,
      },
    } as { [currency: string]: CosmosCurrencyConfig },
  },
};

export default defaultConfig;
