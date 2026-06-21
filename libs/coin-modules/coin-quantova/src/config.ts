/**
 * Currency configuration for Quantova.
 *
 * `nodeEndpoint` points at a `q_` JSON-RPC node. `metadataHash` mirrors the runtime's
 * `enable_metadata_hash("QTOV", 18)` digest parameters used by the `CheckMetadataHash`
 * (RFC-78) transaction extension for clear-signing.
 */
import {
  DEFAULT_NODE_ENDPOINTS,
  QTOV_DECIMALS,
  QTOV_SYMBOL,
  TQTOV_SYMBOL,
  SS58_FORMAT,
  METADATA_HASH,
} from "./constants";

export type QuantovaCoinConfig = {
  /** display symbol - "QTOV" (mainnet) or "TQTOV" (testnet) */
  symbol: string;
  decimals: number;
  ss58Format: number;
  /** `q_` JSON-RPC endpoint */
  nodeEndpoint: string;
  /** RFC-78 metadata-hash digest parameters (symbol + decimals) */
  metadataHash: { tokenSymbol: string; decimals: number };
};

export const mainnetConfig: QuantovaCoinConfig = {
  symbol: QTOV_SYMBOL,
  decimals: QTOV_DECIMALS,
  ss58Format: SS58_FORMAT,
  nodeEndpoint: DEFAULT_NODE_ENDPOINTS.mainnet,
  metadataHash: METADATA_HASH,
};

export const testnetConfig: QuantovaCoinConfig = {
  ...mainnetConfig,
  symbol: TQTOV_SYMBOL,
  nodeEndpoint: DEFAULT_NODE_ENDPOINTS.testnet,
};

export default { mainnetConfig, testnetConfig };
