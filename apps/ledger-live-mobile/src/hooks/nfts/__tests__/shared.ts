import { NftStatus } from "@ledgerhq/live-nft/lib/types";
import { BlockchainEVM } from "@ledgerhq/live-nft/supported";

export const nftCollectionsStatusByNetwork = {
  [BlockchainEVM.Ethereum]: {},
  [BlockchainEVM.Avalanche]: {},
  [BlockchainEVM.Polygon]: {},
  [BlockchainEVM.Arbitrum]: {},
  [BlockchainEVM.Base]: {},
  [BlockchainEVM.Blast]: {},
  [BlockchainEVM.Bsc]: {},
  [BlockchainEVM.Canto]: {},
  [BlockchainEVM.Celo]: {},
  [BlockchainEVM.Cyber]: {},
  [BlockchainEVM.Degen]: {},
  [BlockchainEVM.Fantom]: {},
  [BlockchainEVM.Gnosis]: {},
  [BlockchainEVM.Godwoken]: {},
  [BlockchainEVM.Linea]: {},
  [BlockchainEVM.Loot]: {},
  [BlockchainEVM.Manta]: {},
  [BlockchainEVM.Mode]: {},
  [BlockchainEVM.Moonbeam]: {},
  [BlockchainEVM.Opbnb]: {},
  [BlockchainEVM.Optimism]: {},
  [BlockchainEVM.Palm]: {},
  [BlockchainEVM.ProofOfPlay]: {},
  [BlockchainEVM.Rari]: {},
  [BlockchainEVM.Scroll]: {},
  [BlockchainEVM.Sei]: {},
  [BlockchainEVM.Xai]: {},
  [BlockchainEVM.Zora]: {},
};

export const mockNftCollectionStatusByNetwork2 = {
  ...nftCollectionsStatusByNetwork,
  [BlockchainEVM.Ethereum]: {
    collectionETHA: NftStatus.whitelisted,
    collectionETHB: NftStatus.blacklisted,
    collectionETHC: NftStatus.spam,
    collectionETHD: NftStatus.spam,
  },
  [BlockchainEVM.Avalanche]: {
    collectionAVAX1: NftStatus.blacklisted,
    collectionAVAX2: NftStatus.spam,
    collectionAVAX3: NftStatus.blacklisted,
  },
  [BlockchainEVM.Polygon]: {
    collectionP1: NftStatus.blacklisted,
    collectionP2: NftStatus.whitelisted,
  },
};
