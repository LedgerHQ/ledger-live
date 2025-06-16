/**
 * Supported blockchains for the live-nft library.
 */
export enum SupportedBlockchain {
  Arbitrum = "arbitrum",
  Avalanche = "avalanche_c_chain",
  Base = "base",
  Bsc = "bsc",
  Ethereum = "ethereum",
  Optimism = "optimism",
  Polygon = "polygon",
  Solana = "solana",
}

// For SimpleHash Api
export const replacements: { [key: string]: string } = {
  [SupportedBlockchain.Avalanche]: "avalanche",
};
