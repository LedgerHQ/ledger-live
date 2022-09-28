import type { LoadConfig } from "../types";

const defaultLoadConfig = {
  nftExplorerBaseURL: null, // set a value when an official production endpoint is released
  pluginBaseURL: "https://cdn.live.ledger.com",
  extraPlugins: null,
  erc20SignaturesBaseURL: "https://cdn.live.ledger-stg.com",
};

export function getLoadConfig(userLoadConfig?: LoadConfig): LoadConfig {
  return {
    ...defaultLoadConfig,
    ...userLoadConfig,
  };
}
