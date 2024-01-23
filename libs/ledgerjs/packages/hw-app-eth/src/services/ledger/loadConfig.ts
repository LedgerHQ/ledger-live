import type { LoadConfig } from "../types";

const defaultLoadConfig: Required<LoadConfig> = {
  nftExplorerBaseURL: "https://nft.api.live.ledger.com/v1/ethereum",
  pluginBaseURL: "https://cdn.live.ledger.com",
  extraPlugins: null,
  cryptoassetsBaseURL:
    "https://cdn.live.ledger-stg.com/cryptoassets/branches/BACK-6071-lowercase-identifiers-are-back/cryptoassets",
};

export function getLoadConfig(userLoadConfig?: LoadConfig): LoadConfig {
  return {
    ...defaultLoadConfig,
    ...userLoadConfig,
  };
}
