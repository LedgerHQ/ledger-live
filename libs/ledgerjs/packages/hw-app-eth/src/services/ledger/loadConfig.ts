import type { LoadConfig } from "../types";

const defaultLoadConfig: LoadConfig = {
  nftExplorerBaseURL: "https://nft.api.live.ledger.com/v1/ethereum",
  nftMetadataBaseURL: "https://nft.api.live.ledger.com/v1",
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
