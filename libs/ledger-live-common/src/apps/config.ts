import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

// Configurations for nano apps, can be set with firebase
const appConfig: Record<string, ConfigInfo> = {
  config_nanoapp_cosmos: {
    type: "object",
    default: {
      minVersion: "2.34.12",
    },
  },
  config_nanoapp_algorand: {
    type: "object",
    default: {
      minVersion: "1.2.9",
    },
  },
  config_nanoapp_multiversx: {
    type: "object",
    default: {
      minVersion: "1.0.18",
    },
  },
  config_nanoapp_polkadot: {
    type: "object",
    default: {
      minVersion: "25.10100.0",
    },
  },
  config_nanoapp_ethereum: {
    type: "object",
    default: {
      minVersion: "1.10.3-0",
    },
  },
  config_nanoapp_solana: {
    type: "object",
    default: {
      minVersion: "1.2.0",
    },
  },
  config_nanoapp_celo: {
    type: "object",
    default: {
      minVersion: "1.1.8",
    },
  },
  config_nanoapp_cardano_ada: {
    type: "object",
    default: {
      minVersion: "4.1.0",
    },
  },
  config_nanoapp_zcash: {
    type: "object",
    default: {
      minVersion: "2.1.0",
    },
  },
  config_nanoapp_near: {
    type: "object",
    default: {
      minVersion: "1.2.1",
    },
  },
  config_nanoapp_tezos_wallet: {
    type: "object",
    default: {
      minVersion: "2.4.5",
    },
  },
};

export { appConfig };
