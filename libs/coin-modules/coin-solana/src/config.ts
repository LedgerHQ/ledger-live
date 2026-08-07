import buildCoinConfig, {
  type CoinConfig,
  type Context,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type SolanaConfig = {
  token2022Enabled: boolean;
  legacyOCMSMaxVersion: string;
  rpcUrls?: {
    solana?: string;
    solana_devnet?: string;
    solana_testnet?: string;
  };
  validatorsUrl?: string;
};

export type SolanaCoinConfig = CurrencyConfig & SolanaConfig;

/**
 * The {@link Context} threaded through the coin-solana low layers (ADR-019).
 *
 * The free-form `Record` part carries a `currencyId` used to resolve the RPC endpoint.
 */
export type SolanaContext = Context<SolanaCoinConfig>;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<SolanaCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => SolanaCoinConfig;
} = buildCoinConfig<SolanaCoinConfig>();

export default coinConfig;
