import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { NFT, Operation } from "../types";
import { encodeNftId } from ".";

type Collection = NFT["collection"];

type CollectionMap<C> = Record<string, C>;

export type CollectionWithNFT = Collection & {
  nfts: Array<Omit<NFT, "collection">>;
};

export const nftsFromOperations = (ops: Operation[]): NFT[] => {
  const nftsMap = ops
    // if ops are Operations get the prop nftOperations, else ops are considered nftOperations already
    .flatMap((op) => (op?.nftOperations?.length ? op.nftOperations : op))
    .reduce((acc: Record<string, NFT>, nftOp: Operation) => {
      let { contract } = nftOp;
      if (!contract) {
        return acc;
      }

      // Creating a "token for a contract" unique key
      contract = eip55.encode(contract);
      const { tokenId, standard, accountId } = nftOp;
      if (!tokenId || !standard) return acc;
      const id = encodeNftId(accountId, contract, tokenId || "");

      const nft = (acc[id] || {
        id,
        tokenId,
        amount: new BigNumber(0),
        collection: { contract, standard },
      }) as NFT;

      if (nftOp.type === "NFT_IN") {
        nft.amount = nft.amount.plus(nftOp.value);
      } else if (nftOp.type === "NFT_OUT") {
        nft.amount = nft.amount.minus(nftOp.value);
      }

      acc[id] = nft;

      return acc;
    }, {});

  return Object.values(nftsMap);
};

export const nftsByCollections = (
  nfts: NFT[] = [],
  collectionAddress?: string
): CollectionWithNFT[] => {
  const filteredNfts = collectionAddress
    ? nfts.filter((n) => n.collection.contract === collectionAddress)
    : nfts;

  const collectionMap = filteredNfts.reduce(
    (acc: CollectionMap<CollectionWithNFT>, nft: NFT) => {
      const { collection, ...nftWithoutCollection } = nft;

      if (!acc[collection.contract]) {
        acc[collection.contract] = { ...collection, nfts: [] };
      }
      acc[collection.contract].nfts.push(nftWithoutCollection);

      return acc;
    },
    {} as CollectionMap<CollectionWithNFT>
  );

  return Object.values(collectionMap);
};

export const getNftKey = (contract: string, tokenId: string): string => {
  return `${contract}-${tokenId}`;
};
