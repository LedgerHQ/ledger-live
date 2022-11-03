import type { LoadConfig } from "../types";

const defaultLoadConfig = {
  nftExplorerBaseURL: "https://nft.api.live.ledger.com/v1/ethereum",
  pluginBaseURL: "https://cdn.live.ledger.com",
  extraPlugins: null,
  cryptoassetsBaseURL: "https://cdn.live.ledger.com/cryptoassets",
};

export function getLoadConfig(userLoadConfig?: LoadConfig): LoadConfig {
  return {
    ...defaultLoadConfig,
    ...userLoadConfig,
  };
}
