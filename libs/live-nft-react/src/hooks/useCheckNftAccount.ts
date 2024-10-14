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
 * useCheckNftAccount() will apply a spam filtering on top of existing NFT data.
 * - addresses: a list of wallet addresses separated by a ","
 * - nftOwned: the array of all nfts as found by all user's account on Ledger Live
 * - chains: a list of selected network to search for NFTs
 * - action: custom action to handle collections
 * NB: for performance, make sure that addresses, nftOwned and chains are memoized
 */
export function useCheckNftAccount({
  addresses,
  nftsOwned,
  chains,
  threshold,
  action,
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
    enabled: addresses.length > 0,
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
