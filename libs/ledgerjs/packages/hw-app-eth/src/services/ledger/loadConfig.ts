import type { LoadConfig } from "../types";

const defaultLoadConfig: LoadConfig = {
  nftExplorerBaseURL: "https://nft.api.live.ledger.com/v1/ethereum",
  pluginBaseURL: "https://cdn.live.ledger.com",
  extraPlugins: null,
  cryptoassetsBaseURL: "https://cdn.live.ledger.com/cryptoassets",
  calServiceURL: "https://crypto-assets-service.api.ledger.com",
  staticERC20Signatures: null,
  staticEIP712SignaturesV1: null,
  staticEIP712SignaturesV2: null,
};

export function getLoadConfig(userLoadConfig?: LoadConfig): LoadConfig {
  return {
    ...defaultLoadConfig,
    ...userLoadConfig,
  };
}
