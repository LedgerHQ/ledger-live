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
        credentials: getEnv("API_POLKADOT_SIDECAR_CREDENTIALS"),
      },
      node: {
        url: getEnv("API_POLKADOT_NODE"),
      },
      staking: {
        electionStatusThreshold: getEnv("POLKADOT_ELECTION_STATUS_THRESHOLD"),
      },
      metadataShortener: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
      },
      metadataHash: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
      },
      runtimeUpgraded: true,
    },
  },
};
