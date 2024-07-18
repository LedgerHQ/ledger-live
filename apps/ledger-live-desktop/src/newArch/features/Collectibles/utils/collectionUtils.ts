import { NFT, ProtoNFT } from "@ledgerhq/types-live";

type NFTCollectionItem = (ProtoNFT | NFT)[];

export const filterHiddenCollections = (
  collections: NFTCollectionItem | Record<string, NFTCollectionItem>,
  hiddenNftCollections: string[],
  accountId: string,
): [string, NFTCollectionItem][] =>
  Object.entries(collections).filter(
    ([contract]) => !hiddenNftCollections.includes(`${accountId}|${contract}`),
  );

export const mapCollectionsToStructure = (
  filteredCollections: [string, NFTCollectionItem][],
  numberOfVisibleCollections: number,

  onOpenCollection: (collectionAddress?: string) => void,
) =>
  filteredCollections.slice(0, numberOfVisibleCollections).map(([contract, nfts]) => ({
    contract,
    nft: nfts[0] as ProtoNFT,
    nftsNumber: Number(nfts.length),
    onClick: onOpenCollection,
  }));
