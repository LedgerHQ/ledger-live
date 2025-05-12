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
      indexer: {
        url: getEnv("API_POLKADOT_INDEXER"),
      },
      node: {
        url: getEnv("API_POLKADOT_NODE"),
      },
      staking: {
        electionStatusThreshold: getEnv("POLKADOT_ELECTION_STATUS_THRESHOLD"),
      },
      metadataShortener: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
        id: "dot",
      },
      metadataHash: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
      },
    },
  },
  config_currency_westend: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      sidecar: {
        url: "https://polkadot-westend-sidecar.coin.ledger.com",
      },
      node: {
        url: "https://polkadot-westend-fullnodes.api.live.ledger.com/",
      },
      indexer: {
        url: "https://explorers.api.live.ledger.com/blockchain/dot_westend",
      },
      metadataShortener: {
        url: "https://polkadot-westend-metadata-shortener.api.live.ledger.com/transaction/metadata",
        id: "dot-hub",
      },
      metadataHash: {
        url: "https://polkadot-westend-metadata-shortener.api.live.ledger.com/node/metadata/hash",
      },
    },
  },
};
