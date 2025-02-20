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
import { NFTOperations } from "@ledgerhq/live-nft/types";
import { Operation } from "@ledgerhq/types-live";

import { useNftCollectionMetadataBatch } from "../NftMetadataProvider";

export function useSpamTxFiltering(
  threshold: number,
  nftOperations: NFTOperations,
  currentNftPageOps: Operation[],
) {
  // get NFT metadata
  const metadatas = useNftCollectionMetadataBatch(nftOperations);
  // build metadata map
  const metadataMap = new Map(
    metadatas.map(meta => [meta.metadata?.contract.toLowerCase(), meta.metadata?.spamScore ?? 0]),
  );
  // filter forbidden NFT operations
  const data = currentNftPageOps.filter(
    op => (metadataMap.get(op.contract?.toLowerCase()) ?? 0) <= threshold,
  );
  return { data };
}
