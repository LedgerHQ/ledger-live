import type { FeaturesMap } from "@ledgerhq/coin-framework/features/types";

export const supportedFeatures: FeaturesMap = {
  blockchain: ["blockchain_txs"],
  tokens: ["tokens_balance", "tokens_history", "tokens_craft"],
  gasOptions: ["token_craft_gas"],
  dApps: ["wallet_api"],
  native_assets: ["native_craft", "native_balance", "native_history"],
};
