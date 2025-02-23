/**
 * Hook to filter out spam NFT operations based on a given spam score threshold.
 *
 * @param {number} threshold - The spam score threshold. NFT operations with a spam score higher than this will be filtered out.
 * @param {NFTOperations} nftOperations - The NFT operations to be filtered.
 * @param {Operation[]} currentNftPageOps - The current page of NFT operations to be filtered.
 *
 * @returns {{ data: Operation[] }} - An object containing the filtered NFT operations.
 *
 * @remarks
 * This hook retrieves NFT metadata, builds a metadata map with spam scores, and filters out NFT operations that exceed the spam score threshold.
 */
import { Operation } from "@ledgerhq/types-live";

import { useNftCollectionMetadataBatch } from "../NftMetadataProvider";

type NftOp = {
  contract: string;
  currencyId: string;
  operation: Operation;
};

export function useFilterNftSpams(
  threshold: number,
  nftOperations: Record<string, NftOp>,
  currentNftPageOps: Operation[],
) {
  // get NFT metadata
  const metadatas = useNftCollectionMetadataBatch(nftOperations);
  // build metadata map
  const metadataMap = new Map(
    metadatas.map(meta => [meta.metadata?.contract.toLowerCase(), meta.metadata?.spamScore ?? 0]),
  );

  const isFetching = !metadatas.every(meta => meta.status === "loaded");
  const spamOps = Object.values(nftOperations)
    .filter((nftOp: NftOp) => {
      return (metadataMap.get(nftOp.contract?.toLowerCase()) ?? 0) > threshold;
    })
    .map(nftOp => ({
      ...nftOp,
      spamScore: metadataMap.get(nftOp.contract?.toLowerCase()) ?? 0,
      collectionId: `${nftOp.operation.accountId}|${nftOp.contract}`,
    }));

  // filter forbidden NFT operations
  const filteredOps = isFetching
    ? []
    : currentNftPageOps.filter(
        op => (metadataMap.get(op.contract?.toLowerCase()) ?? 0) <= threshold,
      );

  return { filteredOps, spamOps, isFetching };
}
