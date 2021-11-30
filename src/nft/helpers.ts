import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { NFT, Operation, Transaction } from "../types";

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
      if (!nftOp?.contract) {
        return acc;
      }

      // Creating a "token for a contract" unique key
      const contract = eip55.encode(nftOp.contract!);
      const nftKey = contract + nftOp.tokenId!;
      const { tokenId, standard, id } = nftOp;

      const nft = (acc[nftKey] ?? {
        id,
        tokenId: tokenId!,
        amount: new BigNumber(0),
        collection: {
          contract,
          standard: standard!,
        },
      }) as NFT;

      if (nftOp.type === "NFT_IN") {
        nft.amount = nft.amount.plus(nftOp.value);
      } else if (nftOp.type === "NFT_OUT") {
        nft.amount = nft.amount.minus(nftOp.value);
      }

      acc[nftKey] = nft;

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

export const isNftTransaction = (transaction: Transaction): boolean => {
  if (transaction.family === "ethereum") {
    return ["erc721.transfer", "erc1155.transfer"].includes(transaction.mode);
  }

  return false;
};
