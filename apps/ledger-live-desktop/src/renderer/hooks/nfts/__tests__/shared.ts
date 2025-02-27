import { BlockchainEVM } from "@ledgerhq/live-nft/lib-es/supported";
import { NftStatus } from "@ledgerhq/live-nft/lib-es/types";

export const mockNftCollectionStatusByNetwork = {
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
