import { NftStatus } from "@ledgerhq/live-nft/lib/types";
import { SupportedBlockchain } from "@ledgerhq/live-nft/supported";

export const nftCollectionsStatusByNetwork = {
  [SupportedBlockchain.Ethereum]: {},
  [SupportedBlockchain.Avalanche]: {},
  [SupportedBlockchain.Polygon]: {},
  [SupportedBlockchain.Arbitrum]: {},
  [SupportedBlockchain.Base]: {},
  [SupportedBlockchain.Bsc]: {},
  [SupportedBlockchain.Optimism]: {},
  [SupportedBlockchain.Solana]: {},
};

export const mockNftCollectionStatusByNetwork2 = {
  ...nftCollectionsStatusByNetwork,
  [SupportedBlockchain.Ethereum]: {
    collectionETHA: NftStatus.whitelisted,
    collectionETHB: NftStatus.blacklisted,
    collectionETHC: NftStatus.spam,
    collectionETHD: NftStatus.spam,
  },
  [SupportedBlockchain.Avalanche]: {
    collectionAVAX1: NftStatus.blacklisted,
    collectionAVAX2: NftStatus.spam,
    collectionAVAX3: NftStatus.blacklisted,
  },
  [SupportedBlockchain.Polygon]: {
    collectionP1: NftStatus.blacklisted,
    collectionP2: NftStatus.whitelisted,
  },
};
