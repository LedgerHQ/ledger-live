import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

export const polkadotConfig: Record<string, ConfigInfo> = {
  config_currency_polkadot: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      sidecar: {
        url: getEnv("API_POLKADOT_SIDECAR"),
      },
      metadataShortener: {
        url: "https://api.zondax.ch/polkadot/transaction/metadata",
      },
      metadataHash: {
        url: "https://api.zondax.ch/polkadot/node/metadata/hash",
      },
      runtimeUpgraded: false,
    },
  },
};
