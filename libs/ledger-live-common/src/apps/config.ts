import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

const appConfig: Record<string, ConfigInfo> = {
  config_app_cosmos: {
    type: "object",
    default: {
      minVersion: "2.34.12",
    },
  },
  config_app_algorand: {
    type: "object",
    default: {
      minVersion: "1.2.9",
    },
  },
  config_app_multiversx: {
    type: "object",
    default: {
      minVersion: "1.0.18",
    },
  },
  config_app_polkadot: {
    type: "object",
    default: {
      minVersion: "25.10100.0",
    },
  },
  config_app_ethereum: {
    type: "object",
    default: {
      minVersion: "1.10.3-0",
    },
  },
  config_app_solana: {
    type: "object",
    default: {
      minVersion: "1.2.0",
    },
  },
  config_app_celo: {
    type: "object",
    default: {
      minVersion: "1.1.8",
    },
  },
  "config_app_cardano ada": {
    type: "object",
    default: {
      minVersion: "4.1.0",
    },
  },
  config_app_zcash: {
    type: "object",
    default: {
      minVersion: "2.1.0",
    },
  },
  config_app_near: {
    type: "object",
    default: {
      minVersion: "1.2.1",
    },
  },
  "config_app_tezos wallet": {
    type: "object",
    default: {
      minVersion: "2.4.5",
    },
  },
};

export { appConfig };
