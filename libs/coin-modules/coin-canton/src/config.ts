import buildCoinConfig, {
  CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type CantonConfig = {
  nodeUrl?: string;
  nodeId?: string;
  gatewayUrl?: string;
  // TODELETE
  minReserve?: number;
  networkType: "mainnet" | "devnet" | "testnet" | "localnet";
  useGateway?: boolean;
  nativeInstrumentId: string;
  fee?: number;
};

export type CantonCoinConfig = CurrencyConfig & CantonConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<CantonCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => CantonCoinConfig;
} = buildCoinConfig<CantonCoinConfig>();

export default coinConfig;
