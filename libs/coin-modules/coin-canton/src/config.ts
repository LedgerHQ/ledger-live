import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type CantonConfig = {
  nodeUrl?: string;
  gatewayUrl?: string;
  // TODELETE
  minReserve?: number;
  networkType: "mainnet" | "devnet" | "localnet";
  useGateway?: boolean;
};

export type CantonCoinConfig = CurrencyConfig & CantonConfig;

const coinConfig = buildCoinConfig<CantonCoinConfig>();

export default coinConfig;
