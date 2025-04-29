import { SupportedBlockchain } from "@ledgerhq/live-nft/lib-es/supported";
import { NftStatus } from "@ledgerhq/live-nft/lib-es/types";

export const mockNftCollectionStatusByNetwork = {
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
