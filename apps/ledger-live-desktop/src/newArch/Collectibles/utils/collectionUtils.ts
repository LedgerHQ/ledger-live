import { NFT, ProtoNFT } from "@ledgerhq/types-live";

export const filterHiddenCollections = (
  collections: (ProtoNFT | NFT)[] | Record<string, (ProtoNFT | NFT)[]>,
  hiddenNftCollections: string[],
  accountId: string,
): [string, (ProtoNFT | NFT)[]][] =>
  Object.entries(collections).filter(
    ([contract]) => !hiddenNftCollections.includes(`${accountId}|${contract}`),
  );

export const mapCollectionsToStructure = (
  filteredCollections: [string, (ProtoNFT | NFT)[]][],
  numberOfVisibleCollections: number,

  onOpenCollection: (collectionAddress?: string) => void,
) =>
  filteredCollections.slice(0, numberOfVisibleCollections).map(([contract, nfts]) => ({
    contract,
    nft: nfts[0] as ProtoNFT,
    nftsNumber: Number(nfts.length),
    onClick: onOpenCollection,
  }));
