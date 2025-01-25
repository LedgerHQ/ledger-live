/**
 * Supported blockchains EVM by Backend
 */
export enum BlockchainEVM {
  Arbitrum = "arbitrum",
  Avalanche = "avalanche_c_chain",
  Base = "base",
  Blast = "blast",
  Bsc = "bsc",
  Canto = "canto",
  Celo = "celo",
  Cyber = "cyber",
  Degen = "degen",
  Ethereum = "ethereum",
  Fantom = "fantom",
  Gnosis = "gnosis",
  Godwoken = "godwoken",
  Linea = "linea",
  Loot = "loot",
  Manta = "manta",
  Mode = "mode",
  Moonbeam = "moonbeam",
  Opbnb = "opbnb",
  Optimism = "optimism",
  Palm = "palm",
  Polygon = "polygon",
  ProofOfPlay = "proofofplay",
  Rari = "rari",
  Scroll = "scroll",
  Sei = "sei_network",
  Xai = "xai",
  Zora = "zora",
}

export const blockchainEVMList: BlockchainEVM[] = Object.values(BlockchainEVM);

export const SUPPORTED_BLOCKCHAINS_LIVE = [
  // BlockchainEVM.Arbitrum,
  BlockchainEVM.Avalanche,
  //BlockchainEVM.Base,
  // BlockchainEVM.Blast,
  BlockchainEVM.Bsc,
  // BlockchainEVM.Celo,
  BlockchainEVM.Ethereum,
  // BlockchainEVM.Fantom,
  // BlockchainEVM.Linea,
  // BlockchainEVM.Moonbeam,
  //BlockchainEVM.Optimism,
  BlockchainEVM.Polygon,
  //BlockchainEVM.Scroll,
  // BlockchainEVM.Sei,
];

export type BlockchainsType = (typeof blockchainEVMList)[number];

export type SupportedBlockchainsType = (typeof SUPPORTED_BLOCKCHAINS_LIVE)[number];

// For SimpleHash Api
export const replacements: { [key: string]: string } = {
  [BlockchainEVM.Avalanche]: "avalanche",
  [BlockchainEVM.Sei]: "sei",
};
