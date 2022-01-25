import type { LoadConfig } from "../types";

const defaultLoadConfig = {
  nftExplorerBaseURL: null, // set a value when an official production endpoint is released
  pluginBaseURL: "https://cdn.live.ledger.com",
  extraPlugins: null,
};

export function getLoadConfig(userLoadConfig?: LoadConfig): LoadConfig {
  return {
    ...defaultLoadConfig,
    ...userLoadConfig,
  };
}
