/**
 * Concordium network chain IDs for WalletConnect protocol
 * These identify Concordium Mainnet and Testnet in WalletConnect sessions
 */
export const CONCORDIUM_CHAIN_IDS = {
  Mainnet: "ccd:9dd9ca4d19e9393877d2c44b70f89acb",
  Testnet: "ccd:4221332d34e1694168c2a0c0b3fd0f27",
} as const;

export const CONCORDIUM_ID_APP_MOBILE_HOST = "concordiumidapp://";

export const MAX_MEMO_SIZE = 256;
