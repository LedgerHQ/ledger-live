import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchNftsFromSimpleHash } from "@ledgerhq/live-nft/api/simplehash";
import { ProtoNFT } from "@ledgerhq/types-live";
import { NFTS_QUERY_KEY } from "../queryKeys";
import { HookProps, NftsFilterResult } from "./types";
import { decodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { nftsByCollections } from "@ledgerhq/live-nft/index";
import { hashProtoNFT } from "./helpers";

/**
 * A React hook that checks NFT accounts against specified criteria and provides filtering functionality for managing NFT collections.
 *
 * @param {Object} params - The parameters for the hook.
 * @param {string} params.addresses - A comma-separated string of NFT addresses to check.
 * @param {Array} params.nftsOwned - An array of owned NFTs.
 * @param {Array} params.chains - An array representing the blockchain chains.
 * @param {number} params.threshold - A numeric threshold for filtering NFTs.
 * @param {Function} params.action - A callback function to execute when spam is detected.
 * @param {boolean} [params.enabled=false] - A flag to enable or disable the hook's functionality.
 *
 * @returns {Object} The result of the hook.
 * @returns {Array} returns.nfts - An array of filtered NFTs.
 * @returns {Object} returns.queryResult - The result of the infinite query, containing pagination and loading states.
 *
 */

export const ONE_DAY = 24 * 60 * 60 * 1000;
export const HALF_DAY = ONE_DAY / 2;

export function useCheckNftAccount({
  addresses,
  nftsOwned,
  chains,
  threshold,
  action,
  enabled,
}: HookProps): NftsFilterResult {
  // for performance, we hashmap the list of nfts by hash.
  const nftsWithProperties = useMemo(
    () =>
      new Map(nftsOwned.map(obj => [hashProtoNFT(obj.contract, obj.tokenId, obj.currencyId), obj])),
    [nftsOwned],
  );

  const queryResult = useInfiniteQuery({
    queryKey: [NFTS_QUERY_KEY.SpamFilter, addresses, chains],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchNftsFromSimpleHash({ addresses, chains, cursor: pageParam, threshold }),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    enabled: enabled && addresses.length > 0,
    refetchInterval: HALF_DAY,
    staleTime: HALF_DAY,
  });

  useEffect(() => {
    if (queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
      queryResult.fetchNextPage();
    }
  }, [queryResult, queryResult.hasNextPage, queryResult.isFetchingNextPage]);

  const out = useMemo(() => {
    const nfts: ProtoNFT[] = [];

    const processingNFTs = queryResult.data?.pages.flatMap(page => page.nfts);

    if (!queryResult.hasNextPage && processingNFTs) {
      for (const nft of processingNFTs) {
        const hash = hashProtoNFT(nft.contract_address, nft.token_id, nft.chain);
        const existing = nftsWithProperties.get(hash);
        if (existing) {
          nfts.push(existing);
        }
      }

      if (action) {
        const spams = nftsOwned.filter(nft => !nfts.some(ownedNft => ownedNft.id === nft.id));

        const collections = nftsByCollections(spams);

        Object.entries(collections).map(([contract, nfts]: [string, ProtoNFT[]]) => {
          const { accountId } = decodeNftId(nfts[0].id);
          const collection = `${accountId}|${contract}`;
          action(collection);
        });
      }
    }
    return { ...queryResult, nfts };
  }, [queryResult, action, nftsWithProperties, nftsOwned]);

  return out;
}
